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

    let sqlQuery: string;
    let explanation: string;
    let chartType: "bar" | "line" | "pie" | "radar" | "table" | "metric" | "funnel";
    let visualization: any;
    let isTemplate = false;

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
      
      // Generate SQL from template prompt
      const queryResponse = await convertQueryToSQL(
        template.prompt,
        context.role,
        context
      );

      sqlQuery = queryResponse.sql;
      explanation = queryResponse.explanation;
      chartType = template.chartType;
      visualization = queryResponse.visualization;
    } else {
      // Free-form natural language query
      const queryResponse = await convertQueryToSQL(
        naturalQuery,
        context.role,
        context
      );

      sqlQuery = queryResponse.sql;
      explanation = queryResponse.explanation;
      chartType = queryResponse.chartType;
      visualization = queryResponse.visualization;
    }

    // Sanitize SQL
    sqlQuery = sanitizeSQL(sqlQuery);

    // Validate SQL
    validateSQL(sqlQuery, context.role);

    // Add role-based filters
    sqlQuery = addRoleBasedFilters(sqlQuery, context.role, {
      userId: context.userId,
      studentId: context.studentId,
      companyId: context.companyId
    });

    console.log("Executing SQL:", sqlQuery);

    // Execute query with timeout
    const queryPromise = db.execute(drizzleSql.raw(sqlQuery));
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout")), 10000)
    );

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
      queryId: savedQuery.id
    };

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

