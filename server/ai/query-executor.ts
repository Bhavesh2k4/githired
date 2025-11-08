"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { aiQueries, students, companies, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { convertQueryToSQL, generateInsights } from "@/lib/ai/query-generator";
import { validateSQL, sanitizeSQL, addRoleBasedFilters, SQLValidationError } from "@/lib/ai/sql-validator";
import { getTemplateById } from "@/lib/ai/query-templates";
import { sql as drizzleSql } from "drizzle-orm";

interface QueryExecutionResult {
  success: boolean;
  data?: any[];
  insights?: string;
  chartType?: string;
  visualization?: any;
  error?: string;
  queryId?: string;
  sql?: string; // Add SQL query for transparency
  explanation?: string; // Add explanation
  executionTime?: string; // Add execution time
  isQuotaError?: boolean; // Indicates if error is due to quota/rate limit
  retryAfter?: string | null; // Suggested retry time
}

const RECOVERABLE_SQL_ERROR_CODES = new Set([
  "42601", // syntax_error
  "42703", // undefined_column
  "42P01", // undefined_table
  "42803", // grouping_error
  "42883", // undefined_function
  "42P02", // undefined_parameter
  "42P07", // duplicate_table
  "21000"  // cardinality_violation (subquery returned more than one row)
]);

function extractErrorCode(error: any): string | undefined {
  if (!error) return undefined;
  if (typeof error.code === "string") return error.code;
  if (error.cause && typeof error.cause.code === "string") {
    return error.cause.code;
  }
  return undefined;
}

function extractErrorMessage(error: any): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  if (error.cause?.message) return error.cause.message;
  return JSON.stringify(error);
}

function isRecoverableDatabaseError(error: any): boolean {
  const code = extractErrorCode(error);
  if (code && RECOVERABLE_SQL_ERROR_CODES.has(code)) {
    return true;
  }

  const message = extractErrorMessage(error).toLowerCase();
  return (
    message.includes("syntax error") ||
    message.includes("must appear in the group by") ||
    message.includes("does not exist") ||
    message.includes("undefined column") ||
    message.includes("undefined table") ||
    message.includes("undefined function") ||
    message.includes("more than one row returned")
  );
}

async function getAuthContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Fetch user from database to get the actual role
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id)
  });

  if (!currentUser) {
    throw new Error("User not found");
  }

  const userRole = currentUser.role as "student" | "company" | "admin";
  let studentId: string | undefined;
  let companyId: string | undefined;

  if (userRole === "student") {
    const student = await db.query.students.findFirst({
      where: eq(students.userId, session.user.id)
    });
    studentId = student?.id;
  } else if (userRole === "company") {
    const company = await db.query.companies.findFirst({
      where: eq(companies.userId, session.user.id)
    });
    companyId = company?.id;
  }

  return {
    user: session.user,
    userId: session.user.id,
    role: userRole,
    studentId,
    companyId
  };
}

export async function executeAIQuery(
  naturalQuery: string,
  templateId?: string
): Promise<QueryExecutionResult> {
  try {
    const startTime = Date.now();
    const context = await getAuthContext();

    let sqlQuery = "";
    let explanation = "";
    let chartType: "bar" | "line" | "pie" | "radar" | "table" | "metric" | "funnel";
    let visualization: any;
    let isTemplate = false;
    let fixedChartType: typeof chartType | undefined;
    let queryPrompt = naturalQuery;
    let queryResponse: Awaited<ReturnType<typeof convertQueryToSQL>>;

    // Check if using a template
    if (templateId) {
      const template = getTemplateById(templateId);
      if (!template) {
        return { success: false, error: "Template not found" };
      }

      if (template.role !== context.role) {
        return { success: false, error: "Unauthorized access to this template" };
      }

      isTemplate = true;
      fixedChartType = template.chartType;
      queryPrompt = template.prompt;
      queryResponse = await convertQueryToSQL(
        queryPrompt,
        context.role,
        context
      );
    } else {
      queryResponse = await convertQueryToSQL(
        naturalQuery,
        context.role,
        context
      );
    }

    const queryContext = {
      userId: context.userId,
      studentId: context.studentId,
      companyId: context.companyId
    };

    const maxAttempts = 2;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      explanation = queryResponse.explanation;
      chartType = fixedChartType ?? queryResponse.chartType;
      visualization = queryResponse.visualization;
      sqlQuery = sanitizeSQL(queryResponse.sql);

      validateSQL(sqlQuery, context.role);

      sqlQuery = addRoleBasedFilters(sqlQuery, context.role, queryContext);

      console.log("Executing SQL:", sqlQuery);

      // Execute query with timeout
      const queryPromise = db.execute(drizzleSql.raw(sqlQuery));
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), 10000)
      );

      try {
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        const rows = result.rows || result;

        const endTime = Date.now();
        const executionTime = `${endTime - startTime}ms`;

        // Generate insights
        const insights = await generateInsights(naturalQuery, rows, chartType);

        // Save query to history
        const [savedQuery] = await db.insert(aiQueries).values({
          userId: context.userId,
          role: context.role,
          query: naturalQuery,
          generatedSql: sqlQuery,
          results: rows,
          insights,
          chartType,
          isTemplate,
          executionTime
        }).returning();

        return {
          success: true,
          data: rows,
          insights,
          chartType,
          visualization,
          queryId: savedQuery.id,
          sql: sqlQuery,
          explanation,
          executionTime
        };
      } catch (executionError: any) {
        console.error("Query execution error:", executionError);

        if (
          attempt < maxAttempts - 1 &&
          isRecoverableDatabaseError(executionError)
        ) {
          const errorMessage = extractErrorMessage(executionError);
          console.warn(
            "AI-generated SQL failed, requesting corrected query from LLM..."
          );

          queryResponse = await convertQueryToSQL(
            queryPrompt,
            context.role,
            context,
            {
              previousSQL: sqlQuery,
              errorMessage
            }
          );

          // Retry loop
          continue;
        }

        throw executionError;
      }
    }

  } catch (error: any) {
    console.error("Query execution error:", error);

    if (error instanceof SQLValidationError) {
      return {
        success: false,
        error: error.message
      };
    }

    if (error.message === "Query timeout") {
      return {
        success: false,
        error: "Query took too long to execute. Please try a simpler query."
      };
    }

    // Check if it's a quota/rate limit error
    if (error.isQuotaError || 
        error.message?.includes("quota") || 
        error.message?.includes("rate limit") ||
        error.message?.includes("429") ||
        error.message?.includes("Too Many Requests")) {
      return {
        success: false,
        error: error.message || "AI service quota exceeded. The free tier has been reached. Please try again later or upgrade your API plan.",
        isQuotaError: true,
        retryAfter: error.retryAfter
      };
    }

    return {
      success: false,
      error: error.message || "Failed to execute query. Please try again or rephrase your question."
    };
  }
}

export async function getQueryHistory(limit: number = 10) {
  try {
    const context = await getAuthContext();

    const history = await db.query.aiQueries.findMany({
      where: eq(aiQueries.userId, context.userId),
      orderBy: (queries, { desc }) => [desc(queries.createdAt)],
      limit
    });

    return history;
  } catch (error) {
    console.error("Failed to fetch query history:", error);
    return [];
  }
}

export async function deleteQueryHistory(queryId: string) {
  try {
    const context = await getAuthContext();

    await db.delete(aiQueries)
      .where(eq(aiQueries.id, queryId));

    return { success: true };
  } catch (error) {
    console.error("Failed to delete query:", error);
    return { success: false, error: "Failed to delete query" };
  }
}

export async function clearAllQueryHistory() {
  try {
    const context = await getAuthContext();

    await db.delete(aiQueries)
      .where(eq(aiQueries.userId, context.userId));

    return { success: true };
  } catch (error) {
    console.error("Failed to clear history:", error);
    return { success: false, error: "Failed to clear history" };
  }
}

