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
  // Clean up SQL - remove extra whitespace and newlines for validation
  const cleanSQL = sql.trim().replace(/\s+/g, ' ');
  const upperSQL = cleanSQL.toUpperCase();

  console.log("🔍 Validating SQL:", cleanSQL);
  console.log("🔍 Upper SQL:", upperSQL);

  // Check for forbidden keywords
  for (const keyword of FORBIDDEN_KEYWORDS) {
    // Use word boundaries to avoid false positives (e.g., "INSERT" in "INSERTING")
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(sql)) {
      throw new SQLValidationError(
        `Forbidden SQL operation detected: ${keyword}. Only SELECT queries are allowed.`
      );
    }
  }

  // Must start with SELECT or WITH (CTE - Common Table Expression)
  // WITH is valid for complex queries that eventually SELECT
  if (!upperSQL.startsWith('SELECT') && !upperSQL.startsWith('WITH')) {
    console.error("❌ SQL doesn't start with SELECT or WITH:", upperSQL.substring(0, 50));
    throw new SQLValidationError('Only SELECT queries are allowed');
  }

  // If starts with WITH, ensure it contains SELECT
  if (upperSQL.startsWith('WITH')) {
    if (!upperSQL.includes('SELECT')) {
      console.error("❌ CTE query doesn't contain SELECT");
      throw new SQLValidationError('WITH queries must contain SELECT statement');
    }
    console.log("✅ Valid CTE query detected (starts with WITH)");
  }

  // Check for multiple statements (SQL injection attempt)
  const semicolonCount = (sql.match(/;/g) || []).length;
  if (semicolonCount > 1) {
    throw new SQLValidationError('Multiple SQL statements are not allowed');
  }

  // Check for comments (potential injection) - but allow them in strings
  const sqlWithoutStrings = sql.replace(/'[^']*'/g, '');
  if (sqlWithoutStrings.includes('--') || sqlWithoutStrings.includes('/*')) {
    throw new SQLValidationError('SQL comments are not allowed');
  }

  // Validate table access
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) {
    throw new SQLValidationError('Invalid role specified');
  }

  // PostgreSQL built-in functions that shouldn't be treated as tables
  const PG_FUNCTIONS = new Set([
    'unnest', 'jsonb_array_elements', 'jsonb_array_elements_text',
    'jsonb_each', 'jsonb_each_text', 'generate_series', 'json_array_elements',
    'string_to_array', 'array_agg', 'json_build_array', 'jsonb_build_array'
  ]);

  // Extract CTE names (Common Table Expressions) if query uses WITH
  const cteNames = new Set<string>();
  if (upperSQL.startsWith('WITH')) {
    // Extract CTE names from WITH clause
    // Pattern: WITH CteName AS (...), AnotherCTE AS (...)
    const cteMatches = sql.match(/WITH\s+(\w+)\s+AS|,\s*(\w+)\s+AS/gi) || [];
    cteMatches.forEach(match => {
      const name = match.replace(/WITH\s+/i, '')
                        .replace(/,\s*/i, '')
                        .replace(/\s+AS/i, '')
                        .trim()
                        .toLowerCase();
      if (name) {
        cteNames.add(name);
      }
    });
    console.log("🔍 CTEs found:", Array.from(cteNames));
  }

  // Extract table names from SQL (improved parsing)
  // Match FROM/JOIN followed by table name (not function calls with parentheses)
  const tableMatches = sql.match(/(?:FROM|JOIN)\s+(\w+)(?:\s|,|$|\))/gi) || [];
  const allReferences = tableMatches.map(match => {
    const parts = match.split(/\s+/);
    const candidate = parts[parts.length - 1].toLowerCase().replace(/[,;)\s]/g, '');
    return candidate;
  }).filter(ref => {
    // Filter out empty strings and check if next character after match is '('
    if (!ref) return false;
    
    // Find this reference in original SQL and check if it's followed by '('
    const refPattern = new RegExp(`(?:FROM|JOIN)\\s+${ref}\\s*\\(`, 'i');
    if (refPattern.test(sql)) {
      return false; // It's a function call, not a table
    }
    
    return true;
  });

  // Filter out CTE names and PostgreSQL functions - only validate actual database tables
  const actualTables = allReferences.filter(ref => 
    !cteNames.has(ref) && !PG_FUNCTIONS.has(ref)
  );
  
  console.log("🔍 All references found:", allReferences);
  console.log("🔍 Actual database tables to validate:", actualTables);

  // Remove duplicates
  const uniqueTables = Array.from(new Set(actualTables));

  for (const table of uniqueTables) {
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

  console.log("✅ SQL validation passed");
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
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return sql;

  // PostgreSQL built-in functions that shouldn't be treated as tables
  const PG_FUNCTIONS = new Set([
    'unnest', 'jsonb_array_elements', 'jsonb_array_elements_text',
    'jsonb_each', 'jsonb_each_text', 'generate_series', 'json_array_elements',
    'string_to_array', 'array_agg', 'json_build_array', 'jsonb_build_array'
  ]);

  // Helper function to replace placeholders in conditions
  const replacePlaceholders = (condition: string): string => {
    let replaced = condition;
      if (context.userId) {
      replaced = replaced.replace(':currentUserId', `'${context.userId}'`);
      }
      if (context.studentId) {
      replaced = replaced.replace(':currentStudentId', `'${context.studentId}'`);
    }
    if (context.companyId) {
      replaced = replaced.replace(':currentCompanyId', `'${context.companyId}'`);
    }
    return replaced;
  };

  // Helper function to check if a table is in the FROM clause of a query (not in subqueries)
  const isTableInFromClause = (sqlPart: string, tableName: string): boolean => {
    // Remove all subqueries first to avoid false positives
    let cleaned = sqlPart;
    let depth = 0;
    let result = '';
    
    for (let i = 0; i < sqlPart.length; i++) {
      const char = sqlPart[i];
      if (char === '(') {
        depth++;
      } else if (char === ')') {
        depth--;
      } else if (depth === 0) {
        result += char;
      }
    }
    
    // Now check if table is in FROM/JOIN of this level only
    const fromPattern = new RegExp(`\\bFROM\\s+${tableName}\\b`, 'i');
    const joinPattern = new RegExp(`\\bJOIN\\s+${tableName}\\b`, 'i');
    const aliasPattern = new RegExp(`\\bFROM\\s+${tableName}\\s+\\w+\\b`, 'i');
    
    return fromPattern.test(result) || joinPattern.test(result) || aliasPattern.test(result);
  };

  // Helper function to add filter to a specific table reference
  const addFilterToTableQuery = (sqlPart: string, tableName: string, alreadyFiltered: Set<string>): string => {
    const tablePerms = permissions[tableName];
    if (!tablePerms || !tablePerms.conditions) return sqlPart;

    // Check if table is actually in the FROM clause at this query level
    if (!isTableInFromClause(sqlPart, tableName)) {
      return sqlPart; // Table not in FROM clause at this level
    }

    // Create a unique key for this table in this context
    const filterKey = `${tableName}-${sqlPart.substring(0, 100)}`;
    if (alreadyFiltered.has(filterKey)) return sqlPart;
    
    alreadyFiltered.add(filterKey);
    
    let condition = replacePlaceholders(tablePerms.conditions);
    
    // Check if table has an alias in this query
    const aliasMatch = sqlPart.match(new RegExp(`\\bFROM\\s+${tableName}\\s+(\\w+)\\b`, 'i'));
    if (aliasMatch && aliasMatch[1]) {
      const alias = aliasMatch[1];
      // Replace table name with alias in condition
      condition = condition.replace(new RegExp(`\\b${tableName}\\.`, 'g'), `${alias}.`);
    }
    
    let modified = sqlPart;
    
    // Find the position to insert WHERE clause
    // It must come AFTER all FROM/JOIN clauses (including CROSS JOIN, LATERAL, etc.)
    // but BEFORE GROUP BY, HAVING, ORDER BY, LIMIT
    
    // Look for WHERE clause (but not in subqueries)
    let whereIndex = -1;
    let parenDepth = 0;
    const upperSQL = modified.toUpperCase();
    
    for (let i = 0; i < modified.length; i++) {
      if (modified[i] === '(') parenDepth++;
      else if (modified[i] === ')') parenDepth--;
      else if (parenDepth === 0 && upperSQL.substring(i, i + 5) === 'WHERE') {
        whereIndex = i;
        break;
      }
    }
    
    if (whereIndex !== -1) {
      // Add to existing WHERE
      modified = 
        modified.slice(0, whereIndex) +
        `WHERE ${condition} AND ` +
        modified.slice(whereIndex + 5);
    } else {
      // No WHERE clause exists - we need to add one
      // Find the position after all FROM/JOIN clauses
      
      // Look for these terminating keywords that come after FROM/JOIN
      const terminatorMatch = modified.match(/\b(GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/i);
      
      if (terminatorMatch && terminatorMatch.index !== undefined) {
        // Insert WHERE before the terminator
        modified = 
          modified.slice(0, terminatorMatch.index).trim() +
          ` WHERE ${condition} ` +
          modified.slice(terminatorMatch.index);
      } else {
        // No terminator found - add WHERE at the end
        modified = modified.trim() + ` WHERE ${condition}`;
      }
    }
    
    return modified;
  };

  let modifiedSQL = sql;
  const alreadyFiltered = new Set<string>();

  // Check if query uses CTEs
  if (sql.trim().toUpperCase().startsWith('WITH')) {
    // Parse CTEs and main query separately
    const ctePattern = /WITH\s+([\s\S]+?)(\bSELECT\s+[\s\S]+)$/i;
    const match = sql.match(ctePattern);
    
    if (match) {
      let cteSection = match[1];
      let mainQuery = match[2];
      
      // Process each CTE individually
      // Split by CTE boundaries (look for pattern: name AS ()
      const cteBlocks = [];
      let currentBlock = '';
      let parenDepth = 0;
      let inCTE = false;
      
      for (let i = 0; i < cteSection.length; i++) {
        const char = cteSection[i];
        currentBlock += char;
        
        if (char === '(') {
          parenDepth++;
          inCTE = true;
        } else if (char === ')') {
          parenDepth--;
          if (parenDepth === 0 && inCTE) {
            cteBlocks.push(currentBlock);
            currentBlock = '';
            inCTE = false;
          }
        }
      }
      
      // Add any remaining text
      if (currentBlock.trim()) {
        cteBlocks.push(currentBlock);
      }
      
      // Process each CTE block
      const processedCTEs = cteBlocks.map(block => {
        let processed = block;
        
        // Find which tables are used in this CTE
        const tableMatches = block.match(/(?:FROM|JOIN)\s+(\w+)(?:\s|,|$|\))/gi) || [];
        const tables = [...new Set(tableMatches.map(m => {
          const parts = m.split(/\s+/);
          const candidate = parts[parts.length - 1].toLowerCase().replace(/[,;)\s]/g, '');
          return candidate;
        }).filter(ref => {
          if (!ref) return false;
          // Check if it's a function call
          const refPattern = new RegExp(`(?:FROM|JOIN)\\s+${ref}\\s*\\(`, 'i');
          if (refPattern.test(block)) return false;
          return !PG_FUNCTIONS.has(ref);
        }))];
        
        // Apply filters for each table in this CTE
        for (const table of tables) {
          // Skip CTE references (they typically have uppercase or mixed case in SQL)
          if (permissions[table]) {
            processed = addFilterToTableQuery(processed, table, alreadyFiltered);
          }
        }
        
        return processed;
      }).join('');
      
      // Process main query
      const mainQueryTables = mainQuery.match(/(?:FROM|JOIN)\s+(\w+)(?:\s|,|$|\))/gi) || [];
      const mainTables = [...new Set(mainQueryTables.map(m => {
        const parts = m.split(/\s+/);
        const candidate = parts[parts.length - 1].toLowerCase().replace(/[,;)\s]/g, '');
        return candidate;
      }).filter(ref => {
        if (!ref) return false;
        // Check if it's a function call
        const refPattern = new RegExp(`(?:FROM|JOIN)\\s+${ref}\\s*\\(`, 'i');
        if (refPattern.test(mainQuery)) return false;
        return !PG_FUNCTIONS.has(ref);
      }))];
      
      for (const table of mainTables) {
        if (permissions[table]) {
          mainQuery = addFilterToTableQuery(mainQuery, table, alreadyFiltered);
        }
      }
      
      modifiedSQL = 'WITH ' + processedCTEs + mainQuery;
    }
  } else {
    // Simple query without CTEs - process normally
    const tableMatches = sql.match(/(?:FROM|JOIN)\s+(\w+)(?:\s|,|$|\))/gi) || [];
    const tables = [...new Set(tableMatches.map(m => {
      const parts = m.split(/\s+/);
      const candidate = parts[parts.length - 1].toLowerCase().replace(/[,;)\s]/g, '');
      return candidate;
    }).filter(ref => {
      if (!ref) return false;
      // Check if it's a function call
      const refPattern = new RegExp(`(?:FROM|JOIN)\\s+${ref}\\s*\\(`, 'i');
      if (refPattern.test(sql)) return false;
      return !PG_FUNCTIONS.has(ref);
    }))];
    
    for (const table of tables) {
      if (permissions[table]) {
        modifiedSQL = addFilterToTableQuery(modifiedSQL, table, alreadyFiltered);
      }
    }
  }

  return modifiedSQL;
}

