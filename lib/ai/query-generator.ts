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
  - skills (text[]) - ARRAY of skill strings, use unnest(skills) to expand
  - certifications (jsonb) - array of certification objects
  - experience (jsonb) - array of experience objects
  - resumes (jsonb) - array of resume objects
  - preferred_locations (text[]) - ARRAY of location strings
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
  - specialties (text[]) - ARRAY of specialty strings
  - tech_stack (text[]) - ARRAY of technology strings
  - status (text) - pending, approved, rejected
  - created_at (timestamp)

jobs:
  - id (text, primary key)
  - company_id (text, foreign key to companies.id)
  - title (text)
  - description (text)
  - type (text) - internship, full-time
  - location (text)
  - cgpa_cutoff (text) - minimum CGPA required
  - eligible_courses (text[]) - ARRAY of allowed courses, use = ANY(eligible_courses) to check
  - eligible_degrees (text[]) - ARRAY of allowed degrees, use = ANY(eligible_degrees) to check
  - salary (text) - salary in INR (e.g., "10 LPA" or "10-15 LPA")
  - skills (text[]) - ARRAY of required skill strings, use unnest(skills) to expand
  - benefits (text[]) - ARRAY of benefit strings
  - status (text) - active, stopped
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

IMPORTANT NOTES AND EXAMPLES:

1. TEXT[] Array Operations:
   - To expand array into rows: Use comma syntax or LATERAL
     ✅ CORRECT: SELECT skill FROM jobs, unnest(skills) AS skill
     ✅ CORRECT: SELECT skill FROM jobs CROSS JOIN LATERAL unnest(skills) AS skill
     ❌ WRONG: SELECT skill FROM jobs CROSS JOIN unnest(skills) AS skill (missing LATERAL)
   
   - To check if value exists in array:
     ✅ CORRECT: WHERE 'CSE' = ANY(eligible_courses)
   
   - To count array elements:
     ✅ CORRECT: SELECT array_length(skills, 1) FROM students

2. JSONB Operations:
   - To expand JSONB array: jsonb_array_elements(column)
     ✅ CORRECT: SELECT * FROM students, jsonb_array_elements(certifications) AS cert
   
   - To count JSONB array: jsonb_array_length(column)
     ✅ CORRECT: SELECT jsonb_array_length(certifications) FROM students

3. CGPA and Numeric Comparisons:
   - Always cast TEXT to NUMERIC for math operations
     ✅ CORRECT: WHERE CAST(cgpa AS NUMERIC) >= CAST(cgpa_cutoff AS NUMERIC)
     ✅ CORRECT: AVG(CAST(cgpa AS NUMERIC))

4. Common Query Patterns:
   - Top skills from students:
     SELECT skill, COUNT(*) as count 
     FROM students, unnest(skills) AS skill 
     GROUP BY skill ORDER BY count DESC LIMIT 10
   
   - Students eligible for a job:
     SELECT s.* FROM students s 
     WHERE s.course = ANY((SELECT eligible_courses FROM jobs WHERE id = 'job_id'))
   
   - Jobs with specific skill:
     SELECT * FROM jobs WHERE 'Python' = ANY(skills)

5. All timestamps are in UTC
6. Use PostgreSQL syntax (ILIKE for case-insensitive search, || for concatenation)
`;

function buildPrompt(naturalQuery: string, role: string, context: {
  userId?: string;
  studentId?: string;
  companyId?: string;
}): string {
  const permissions = ROLE_PERMISSIONS[role];
  
  if (!permissions) {
    throw new Error(`Invalid role: ${role}. Must be student, company, or admin.`);
  }
  
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
3. Handle array columns correctly:
   - For TEXT[] arrays (skills, eligible_courses, etc.): Use comma syntax with unnest() or = ANY()
     Example: FROM students, unnest(skills) AS skill
   - For JSONB arrays: Use jsonb_array_elements() or jsonb_array_length()
   - NEVER use "CROSS JOIN unnest()" without LATERAL - use comma syntax instead
4. Cast text columns to appropriate types when needed (CAST(cgpa AS NUMERIC))
5. For CGPA comparisons, always cast to NUMERIC
6. For salary, assume format is "X LPA" or "X-Y LPA", extract and convert as needed
7. When filtering by current user/student/company, the filtering will be handled automatically - don't add WHERE clauses for this
8. Suggest appropriate chart type based on data (bar, line, pie, radar, table, metric, funnel)
9. For metrics (single number), return as a single row with column name "value" and optionally "label"
10. Limit results to reasonable numbers (e.g., top 10, top 20)
11. NEVER use jsonb_array_elements() on TEXT[] columns - use unnest() instead
12. Use comma syntax for simple joins/unnest: "FROM table1, unnest(array) AS item" instead of CROSS JOIN

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
  if (!naturalQuery || naturalQuery.trim().length === 0) {
    throw new Error("Query cannot be empty");
  }

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
    
    if (!response || !response.sql) {
      throw new Error("Invalid response from AI - missing SQL query");
    }
    
    return response;
  } catch (error: any) {
    console.error("Query generation error:", error);
    const errorMessage = error.message || "Failed to convert natural language to SQL. Please try rephrasing your question.";
    throw new Error(errorMessage);
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

