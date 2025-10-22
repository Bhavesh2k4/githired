import { generateStructuredResponse } from "./gemini-client";
import { ROLE_PERMISSIONS } from "./sql-validator";

interface QueryResponse {
  sql: string;
  explanation: string;
  chartType: "bar" | "line" | "pie" | "radar" | "table" | "metric" | "funnel";
  visualization: {
    xAxis?: string;
    yAxis?: string;
    groupBy?: string;
  };
}

// Database schema information for AI context
const DATABASE_SCHEMA = `
TABLES:

students:
  - id (text, primary key)
  - user_id (text, foreign key to user.id)
  - email (text)
  - name (text)
  - srn (text)
  - phone (text)
  - cgpa (text) - student's current CGPA
  - degree (text) - BTech, MTech, MCA
  - course (text) - CSE, ECE, EEE, AIML
  - skills (jsonb) - array of skill objects with {skill, proficiency}
  - certifications (jsonb) - array of certification objects
  - experience (jsonb) - array of experience objects
  - resumes (jsonb) - array of resume objects
  - status (text) - pending, approved, rejected
  - created_at (timestamp)

companies:
  - id (text, primary key)
  - user_id (text, foreign key to user.id)
  - name (text)
  - email (text)
  - industry (text)
  - size (text)
  - location (text)
  - website (text)
  - status (text) - pending, approved, rejected
  - created_at (timestamp)

jobs:
  - id (text, primary key)
  - company_id (text, foreign key to companies.id)
  - title (text)
  - description (text)
  - type (text) - intern, full-time
  - location (text)
  - cgpa_cutoff (text) - minimum CGPA required
  - eligible_courses (jsonb) - array of allowed courses
  - eligible_degrees (jsonb) - array of allowed degrees
  - salary (text) - salary in INR
  - skills (jsonb) - required skills array
  - benefits (jsonb) - benefits array
  - status (text) - active, closed
  - analytics (jsonb) - {views: number, applications: number}
  - created_at (timestamp)

applications:
  - id (text, primary key)
  - job_id (text, foreign key to jobs.id)
  - student_id (text, foreign key to students.id)
  - status (text) - pending, oa, interview, selected, rejected
  - student_cgpa (text) - CGPA at time of application
  - student_course (text) - course at time of application
  - student_degree (text) - degree at time of application
  - applied_at (timestamp)

user:
  - id (text, primary key)
  - name (text)
  - email (text)
  - role (text) - student, company, admin
  - created_at (timestamp)

IMPORTANT NOTES:
- JSONB columns (skills, certifications, eligible_courses, etc.) are stored as JSON arrays
- To query JSONB: Use jsonb_array_elements() to unnest arrays
- To count JSONB array length: Use jsonb_array_length()
- CGPAs and salary are stored as TEXT, cast to numeric for comparisons
- All timestamps are in UTC
- Use PostgreSQL syntax (ILIKE for case-insensitive search, || for concatenation)
`;

function buildPrompt(naturalQuery: string, role: string, context: {
  userId?: string;
  studentId?: string;
  companyId?: string;
}): string {
  const permissions = ROLE_PERMISSIONS[role];
  const allowedTables = Object.keys(permissions).filter(t => permissions[t].allowed);

  return `You are a PostgreSQL SQL expert. Convert the following natural language query to a valid PostgreSQL SELECT query.

USER ROLE: ${role}
ALLOWED TABLES: ${allowedTables.join(', ')}

DATABASE SCHEMA:
${DATABASE_SCHEMA}

CONTEXT:
${role === 'student' ? `- Current student ID: ${context.studentId}` : ''}
${role === 'company' ? `- Current company ID: ${context.companyId}` : ''}
${role !== 'admin' ? `- Current user ID: ${context.userId}` : ''}

QUERY: "${naturalQuery}"

REQUIREMENTS:
1. Generate a valid PostgreSQL SELECT query
2. Only use tables from ALLOWED TABLES list
3. Handle JSONB columns properly (use jsonb_array_elements, jsonb_array_length, etc.)
4. Cast text columns to appropriate types when needed (CAST(cgpa AS NUMERIC))
5. For CGPA comparisons, always cast to NUMERIC
6. For salary, assume format is "X LPA" or "X-Y LPA", extract and convert as needed
7. When filtering by current user/student/company, the filtering will be handled automatically - don't add WHERE clauses for this
8. Suggest appropriate chart type based on data (bar, line, pie, radar, table, metric, funnel)
9. For metrics (single number), return as a single row with column name "value" and optionally "label"
10. Limit results to reasonable numbers (e.g., top 10, top 20)

RESPONSE SCHEMA:
{
  "sql": "SELECT ...",
  "explanation": "Plain English explanation of what the query does",
  "chartType": "bar | line | pie | radar | table | metric | funnel",
  "visualization": {
    "xAxis": "column name for x-axis (optional)",
    "yAxis": "column name for y-axis (optional)",
    "groupBy": "column to group by (optional)"
  }
}`;
}

export async function convertQueryToSQL(
  naturalQuery: string,
  role: "student" | "company" | "admin",
  context: {
    userId?: string;
    studentId?: string;
    companyId?: string;
  }
): Promise<QueryResponse> {
  const prompt = buildPrompt(naturalQuery, role, context);
  
  const schema = `{
    "sql": string,
    "explanation": string,
    "chartType": "bar" | "line" | "pie" | "radar" | "table" | "metric" | "funnel",
    "visualization": {
      "xAxis"?: string,
      "yAxis"?: string,
      "groupBy"?: string
    }
  }`;

  try {
    const response = await generateStructuredResponse<QueryResponse>(prompt, schema);
    return response;
  } catch (error) {
    console.error("Query generation error:", error);
    throw new Error("Failed to convert natural language to SQL. Please try rephrasing your question.");
  }
}

export async function generateInsights(
  query: string,
  results: any[],
  chartType: string
): Promise<string> {
  const prompt = `Analyze the following data and provide 3-5 key insights in natural language.

ORIGINAL QUERY: "${query}"
CHART TYPE: ${chartType}
DATA: ${JSON.stringify(results.slice(0, 20))} ${results.length > 20 ? '(showing first 20 rows)' : ''}

Provide insights that are:
1. Actionable and specific
2. Highlight important patterns or trends
3. Written in friendly, professional tone
4. Relevant to the user who asked the query

Format as markdown with bullet points. Keep it concise (max 200 words).`;

  try {
    const insights = await generateStructuredResponse<{insights: string}>(
      prompt,
      '{"insights": "markdown formatted insights"}'
    );
    return insights.insights;
  } catch (error) {
    console.error("Insights generation error:", error);
    return "Unable to generate insights at this time.";
  }
}

export async function generateSuggestions(
  role: "student" | "company" | "admin",
  recentQueries: string[]
): Promise<string[]> {
  const prompt = `Based on the user's role and recent queries, suggest 3-5 relevant follow-up questions they might want to ask.

USER ROLE: ${role}
RECENT QUERIES: ${recentQueries.join(', ')}

Suggest natural language questions that would provide valuable insights for this role.
Return as a JSON array of strings.`;

  try {
    const suggestions = await generateStructuredResponse<{suggestions: string[]}>(
      prompt,
      '{"suggestions": ["question 1", "question 2", ...]}'
    );
    return suggestions.suggestions;
  } catch (error) {
    console.error("Suggestions generation error:", error);
    return [];
  }
}

