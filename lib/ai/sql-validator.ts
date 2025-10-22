// SQL Validator to ensure safe query execution

const ALLOWED_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'ON', 
  'GROUP', 'BY', 'ORDER', 'LIMIT', 'OFFSET', 'AS', 'COUNT', 'SUM', 
  'AVG', 'MIN', 'MAX', 'HAVING', 'DISTINCT', 'AND', 'OR', 'NOT', 
  'IN', 'LIKE', 'BETWEEN', 'IS', 'NULL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'
];

const FORBIDDEN_KEYWORDS = [
  'DROP', 'DELETE', 'TRUNCATE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE',
  'REPLACE', 'EXEC', 'EXECUTE', 'GRANT', 'REVOKE', 'COMMIT', 'ROLLBACK',
  'SAVEPOINT', 'TRANSACTION', 'DECLARE', 'CURSOR', 'PROCEDURE', 'FUNCTION'
];

const SENSITIVE_COLUMNS = [
  'password', 'access_token', 'refresh_token', 'id_token', 'api_key',
  'secret', 'token', 'admin_note'
];

export interface TablePermissions {
  [tableName: string]: {
    allowed: boolean;
    conditions?: string; // WHERE clause to append
    forbiddenColumns?: string[];
  };
}

export const ROLE_PERMISSIONS: Record<string, TablePermissions> = {
  student: {
    students: { 
      allowed: true, 
      conditions: "students.user_id = :currentUserId",
      forbiddenColumns: SENSITIVE_COLUMNS
    },
    jobs: { 
      allowed: true, 
      conditions: "jobs.status = 'active'",
      forbiddenColumns: SENSITIVE_COLUMNS
    },
    applications: { 
      allowed: true, 
      conditions: "applications.student_id = :currentStudentId",
      forbiddenColumns: SENSITIVE_COLUMNS
    },
    companies: { 
      allowed: true, // Can see company names/basic info for jobs
      forbiddenColumns: [...SENSITIVE_COLUMNS, 'admin_note', 'email', 'phone']
    },
    user: { allowed: false },
    account: { allowed: false },
    session: { allowed: false },
    verification: { allowed: false },
    ai_queries: { allowed: false },
    query_templates: { allowed: false }
  },
  company: {
    companies: { 
      allowed: true, 
      conditions: "companies.user_id = :currentUserId",
      forbiddenColumns: SENSITIVE_COLUMNS
    },
    jobs: { 
      allowed: true, 
      conditions: "jobs.company_id = :currentCompanyId",
      forbiddenColumns: SENSITIVE_COLUMNS
    },
    applications: { 
      allowed: true, 
      conditions: "applications.job_id IN (SELECT id FROM jobs WHERE company_id = :currentCompanyId)",
      forbiddenColumns: SENSITIVE_COLUMNS
    },
    students: { 
      allowed: true, 
      conditions: "students.id IN (SELECT student_id FROM applications WHERE job_id IN (SELECT id FROM jobs WHERE company_id = :currentCompanyId))",
      forbiddenColumns: [...SENSITIVE_COLUMNS, 'admin_note', 'phone', 'email'] // Can only see applicants' profiles
    },
    user: { allowed: false },
    account: { allowed: false },
    session: { allowed: false },
    verification: { allowed: false },
    ai_queries: { allowed: false },
    query_templates: { allowed: false }
  },
  admin: {
    // Admin has access to everything except sensitive auth fields
    students: { allowed: true, forbiddenColumns: SENSITIVE_COLUMNS },
    companies: { allowed: true, forbiddenColumns: SENSITIVE_COLUMNS },
    jobs: { allowed: true, forbiddenColumns: SENSITIVE_COLUMNS },
    applications: { allowed: true, forbiddenColumns: SENSITIVE_COLUMNS },
    user: { allowed: true, forbiddenColumns: SENSITIVE_COLUMNS },
    account: { allowed: false },
    session: { allowed: false },
    verification: { allowed: false },
    ai_queries: { allowed: true },
    query_templates: { allowed: true }
  }
};

export class SQLValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SQLValidationError';
  }
}

export function validateSQL(sql: string, role: string): void {
  const upperSQL = sql.toUpperCase();

  // Check for forbidden keywords
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (upperSQL.includes(keyword)) {
      throw new SQLValidationError(
        `Forbidden SQL operation detected: ${keyword}. Only SELECT queries are allowed.`
      );
    }
  }

  // Must start with SELECT
  if (!upperSQL.trim().startsWith('SELECT')) {
    throw new SQLValidationError('Only SELECT queries are allowed');
  }

  // Check for multiple statements (SQL injection attempt)
  if (sql.includes(';') && !sql.trim().endsWith(';')) {
    throw new SQLValidationError('Multiple SQL statements are not allowed');
  }

  // Check for comments (potential injection)
  if (sql.includes('--') || sql.includes('/*')) {
    throw new SQLValidationError('SQL comments are not allowed');
  }

  // Validate table access
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) {
    throw new SQLValidationError('Invalid role specified');
  }

  // Extract table names from SQL (basic parsing)
  const tableMatches = sql.match(/FROM\s+(\w+)|JOIN\s+(\w+)/gi) || [];
  const tables = tableMatches.map(match => {
    const parts = match.split(/\s+/);
    return parts[parts.length - 1].toLowerCase();
  });

  for (const table of tables) {
    if (!permissions[table] || !permissions[table].allowed) {
      throw new SQLValidationError(
        `Access denied to table: ${table}. Your role does not have permission to query this table.`
      );
    }
  }

  // Check for sensitive columns
  for (const column of SENSITIVE_COLUMNS) {
    const regex = new RegExp(`\\b${column}\\b`, 'i');
    if (regex.test(sql)) {
      throw new SQLValidationError(
        `Access denied to sensitive column: ${column}`
      );
    }
  }
}

export function canAccessTable(table: string, role: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.[table]?.allowed || false;
}

export function getTableCondition(table: string, role: string): string | undefined {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.[table]?.conditions;
}

export function sanitizeSQL(sql: string): string {
  // Remove leading/trailing whitespace
  let cleaned = sql.trim();
  
  // Remove trailing semicolon if present
  if (cleaned.endsWith(';')) {
    cleaned = cleaned.slice(0, -1);
  }
  
  return cleaned;
}

export function addRoleBasedFilters(
  sql: string, 
  role: string, 
  context: {
    userId?: string;
    studentId?: string;
    companyId?: string;
  }
): string {
  let modifiedSQL = sql;
  const permissions = ROLE_PERMISSIONS[role];

  if (!permissions) return sql;

  // Extract tables from SQL
  const tableMatches = sql.match(/FROM\s+(\w+)|JOIN\s+(\w+)/gi) || [];
  const tables = tableMatches.map(match => {
    const parts = match.split(/\s+/);
    return parts[parts.length - 1].toLowerCase();
  });

  // Add WHERE conditions for each table
  for (const table of tables) {
    const tablePerms = permissions[table];
    if (tablePerms && tablePerms.conditions) {
      let condition = tablePerms.conditions;
      
      // Replace placeholders
      if (context.userId) {
        condition = condition.replace(':currentUserId', `'${context.userId}'`);
      }
      if (context.studentId) {
        condition = condition.replace(':currentStudentId', `'${context.studentId}'`);
      }
      if (context.companyId) {
        condition = condition.replace(':currentCompanyId', `'${context.companyId}'`);
      }

      // Add condition to SQL
      if (modifiedSQL.toUpperCase().includes('WHERE')) {
        modifiedSQL = modifiedSQL.replace(/WHERE/i, `WHERE ${condition} AND`);
      } else {
        // Insert WHERE before ORDER BY, GROUP BY, or LIMIT
        const insertBefore = modifiedSQL.match(/(ORDER BY|GROUP BY|LIMIT)/i);
        if (insertBefore) {
          const index = modifiedSQL.toUpperCase().indexOf(insertBefore[0].toUpperCase());
          modifiedSQL = 
            modifiedSQL.slice(0, index) + 
            `WHERE ${condition} ` + 
            modifiedSQL.slice(index);
        } else {
          modifiedSQL += ` WHERE ${condition}`;
        }
      }
    }
  }

  return modifiedSQL;
}

