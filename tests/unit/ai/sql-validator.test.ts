import { describe, it, expect } from '@jest/globals';
import { validateSQL, sanitizeSQL } from '@/lib/ai/sql-validator';

describe('SQL Validator', () => {
  describe('SQL Injection Prevention', () => {
    it('should reject SQL with DROP statement', () => {
      const sql = 'SELECT * FROM users; DROP TABLE users;';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/DROP/i);
    });

    it('should reject SQL with DELETE statement without WHERE', () => {
      const sql = 'DELETE FROM users';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/DELETE|forbidden/i);
    });

    it('should reject SQL with UPDATE without WHERE', () => {
      const sql = 'UPDATE users SET email = "hacked@example.com"';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/UPDATE|forbidden/i);
    });

    it('should reject SQL with TRUNCATE statement', () => {
      const sql = 'TRUNCATE TABLE users';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/TRUNCATE/i);
    });

    it('should reject SQL with ALTER statement', () => {
      const sql = 'ALTER TABLE users ADD COLUMN is_admin BOOLEAN';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/ALTER/i);
    });

    it('should reject SQL with CREATE statement', () => {
      const sql = 'CREATE TABLE malicious (id INT)';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/CREATE/i);
    });

    it('should reject SQL with GRANT statement', () => {
      const sql = 'GRANT ALL PRIVILEGES ON *.* TO "hacker"';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/GRANT/i);
    });

    it('should reject SQL with EXEC/EXECUTE statement', () => {
      const sql = 'EXEC sp_configure';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/EXEC/i);
    });

    it('should reject SQL with multiple statements', () => {
      const sql = 'SELECT * FROM jobs; SELECT * FROM users;';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/multiple statements/i);
    });

    it('should reject SQL with comment-based injection', () => {
      const sql = "SELECT * FROM users WHERE id = 1 OR 1=1 --";
      const result = validateSQL(sql, 'student', 'user-id');
      
      // This should be caught by comment detection or suspicious pattern
      expect(result.isValid).toBe(false);
    });
  });

  describe('Sensitive Column Access', () => {
    it('should reject queries accessing password columns', () => {
      const sql = 'SELECT password FROM users';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/sensitive|password/i);
    });

    it('should reject queries accessing emailVerificationToken', () => {
      const sql = 'SELECT emailVerificationToken FROM users';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/sensitive/i);
    });

    it('should reject queries accessing resetPasswordToken', () => {
      const sql = 'SELECT resetPasswordToken FROM users';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/sensitive/i);
    });

    it('should allow queries with password in job descriptions', () => {
      const sql = 'SELECT * FROM jobs WHERE description LIKE "%password manager%"';
      const result = validateSQL(sql, 'company', 'user-id');
      
      // Should be valid since password is in a search context
      expect(result.isValid).toBe(true);
    });
  });

  describe('Role-Based Filtering', () => {
    it('should add WHERE clause for student role', () => {
      const sql = 'SELECT * FROM applications';
      const result = validateSQL(sql, 'student', 'student-123');
      
      expect(result.isValid).toBe(true);
      expect(result.sql).toContain('student_id');
      expect(result.sql).toContain('student-123');
    });

    it('should add WHERE clause for company role', () => {
      const sql = 'SELECT * FROM jobs';
      const result = validateSQL(sql, 'company', 'company-456');
      
      expect(result.isValid).toBe(true);
      expect(result.sql).toContain('company_id');
      expect(result.sql).toContain('company-456');
    });

    it('should not add WHERE clause for admin role', () => {
      const sql = 'SELECT * FROM users';
      const result = validateSQL(sql, 'admin', 'admin-789');
      
      expect(result.isValid).toBe(true);
      // Admin should see all data
      expect(result.sql).toBe(sql);
    });

    it('should preserve existing WHERE clause when adding role filter', () => {
      const sql = 'SELECT * FROM applications WHERE status = "pending"';
      const result = validateSQL(sql, 'student', 'student-123');
      
      expect(result.isValid).toBe(true);
      expect(result.sql).toContain('status = "pending"');
      expect(result.sql).toContain('student_id');
      expect(result.sql).toContain('AND');
    });
  });

  describe('Phantom Alias Detection', () => {
    it('should reject queries with undefined table aliases', () => {
      const sql = 'SELECT GROUP.job_id FROM applications';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/alias|GROUP/i);
    });

    it('should accept queries with properly defined aliases', () => {
      const sql = 'SELECT j.title FROM jobs AS j WHERE j.status = "active"';
      const result = validateSQL(sql, 'company', 'company-id');
      
      expect(result.isValid).toBe(true);
    });

    it('should accept queries with multiple valid aliases', () => {
      const sql = `
        SELECT j.title, c.name 
        FROM jobs AS j 
        JOIN companies AS c ON j.company_id = c.id
      `;
      const result = validateSQL(sql, 'admin', 'admin-id');
      
      expect(result.isValid).toBe(true);
    });

    it('should detect phantom aliases in subqueries', () => {
      const sql = `
        SELECT * FROM (
          SELECT PHANTOM.id FROM jobs
        ) AS subquery
      `;
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/alias|PHANTOM/i);
    });
  });

  describe('Valid Query Patterns', () => {
    it('should accept simple SELECT query', () => {
      const sql = 'SELECT id, title FROM jobs WHERE status = "active"';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(true);
    });

    it('should accept query with JOIN', () => {
      const sql = `
        SELECT j.title, c.name 
        FROM jobs j 
        JOIN companies c ON j.company_id = c.id
      `;
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(true);
    });

    it('should accept query with aggregations', () => {
      const sql = 'SELECT COUNT(*) as total, AVG(salary) as avg_salary FROM jobs';
      const result = validateSQL(sql, 'admin', 'admin-id');
      
      expect(result.isValid).toBe(true);
    });

    it('should accept query with GROUP BY', () => {
      const sql = 'SELECT location, COUNT(*) FROM jobs GROUP BY location';
      const result = validateSQL(sql, 'admin', 'admin-id');
      
      expect(result.isValid).toBe(true);
    });

    it('should accept query with ORDER BY', () => {
      const sql = 'SELECT * FROM jobs ORDER BY created_at DESC LIMIT 10';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(true);
    });

    it('should accept query with subquery', () => {
      const sql = `
        SELECT * FROM jobs 
        WHERE company_id IN (SELECT id FROM companies WHERE verified = true)
      `;
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(true);
    });

    it('should accept query with CTE', () => {
      const sql = `
        WITH recent_jobs AS (
          SELECT * FROM jobs WHERE created_at > NOW() - INTERVAL '30 days'
        )
        SELECT COUNT(*) FROM recent_jobs
      `;
      const result = validateSQL(sql, 'admin', 'admin-id');
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('SQL Sanitization', () => {
    it('should trim whitespace', () => {
      const sql = '  SELECT * FROM jobs  ';
      const sanitized = sanitizeSQL(sql);
      
      expect(sanitized).toBe('SELECT * FROM jobs');
    });

    it('should normalize whitespace', () => {
      const sql = 'SELECT  *   FROM    jobs';
      const sanitized = sanitizeSQL(sql);
      
      expect(sanitized.replace(/\s+/g, ' ')).toBe('SELECT * FROM jobs');
    });

    it('should remove dangerous characters', () => {
      const sql = 'SELECT * FROM jobs;--comment';
      const sanitized = sanitizeSQL(sql);
      
      // Should remove trailing semicolons and comments
      expect(sanitized).not.toContain('--');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query', () => {
      const sql = '';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/empty/i);
    });

    it('should handle whitespace-only query', () => {
      const sql = '   \n  \t  ';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/empty/i);
    });

    it('should handle very long queries', () => {
      const sql = 'SELECT ' + 'column, '.repeat(1000) + 'id FROM jobs';
      const result = validateSQL(sql, 'admin', 'admin-id');
      
      // Should handle but might have length limits
      expect(result.isValid).toBeDefined();
    });

    it('should handle case-insensitive keywords', () => {
      const sql = 'select * from jobs where status = "active"';
      const result = validateSQL(sql, 'student', 'user-id');
      
      expect(result.isValid).toBe(true);
    });
  });
});

