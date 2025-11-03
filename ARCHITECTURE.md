# 🏗️ GitHired - Complete System Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagrams](#architecture-diagrams)
4. [Module Breakdown](#module-breakdown)
5. [NLP to SQL Workflow](#nlp-to-sql-workflow)
6. [Security & Validation](#security--validation)

---

## System Overview

**GitHired** is a full-stack job placement platform connecting students with companies, featuring AI-powered analytics, resume analysis, and natural language query capabilities.

### Core Value Propositions
- **Students**: Profile building, job discovery, ATS resume scanning, peer comparison
- **Companies**: Job posting, applicant tracking, hiring analytics  
- **Admins**: Platform management, analytics, approval workflows

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router, React 19, Server Components)
- **Styling**: TailwindCSS 4, shadcn/ui components
- **State Management**: React Query (@tanstack/react-query)
- **Rich Text**: TipTap editor
- **Charts**: Recharts
- **Animations**: Motion (Framer Motion)

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth (email/password + Google OAuth)
- **File Storage**: AWS S3 with presigned URLs
- **Email**: Resend + React Email

### AI/ML
- **Model**: Google Gemini 2.0 Flash (experimental)
- **Use Cases**: NLP to SQL, resume analysis, profile suggestions, insights generation

---

## Architecture Diagrams

### 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Next.js Frontend<br/>React 19 + TailwindCSS]
    end
    
    subgraph "API Layer"
        B[API Routes<br/>/api/*]
        C[Server Actions<br/>server/*]
    end
    
    subgraph "Authentication"
        D[Better Auth<br/>Session Management]
        E[Middleware<br/>Route Protection]
    end
    
    subgraph "Business Logic"
        F[Student Module]
        G[Company Module]
        H[Jobs Module]
        I[Applications Module]
        J[AI Module]
    end
    
    subgraph "AI Services"
        K[Gemini 2.0 Flash]
        L[Query Generator<br/>NLP → SQL]
        M[ATS Analyzer<br/>Resume Scoring]
        N[Profile Analyzer<br/>Gap Detection]
    end
    
    subgraph "Data Layer"
        O[(PostgreSQL<br/>Neon Serverless)]
        P[Drizzle ORM]
    end
    
    subgraph "External Services"
        Q[AWS S3<br/>File Storage]
        R[Resend<br/>Email Service]
    end
    
    A --> B
    A --> C
    B --> D
    C --> D
    D --> E
    E --> F & G & H & I & J
    
    J --> L & M & N
    L --> K
    M --> K
    N --> K
    
    F & G & H & I & J --> P
    P --> O
    
    F & G --> Q
    H --> R
    I --> R
    
    style A fill:#e1f5ff
    style K fill:#fff4e1
    style O fill:#e8f5e9
    style Q fill:#fce4ec
    style R fill:#f3e5f5
```

### 2. Database Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o| STUDENT : "has profile"
    USER ||--o| COMPANY : "has profile"
    USER ||--o{ AI_QUERIES : "creates"
    
    STUDENT ||--o{ APPLICATIONS : "submits"
    STUDENT ||--o{ ATS_SCANS : "performs"
    STUDENT ||--o| PROFILE_SUGGESTIONS : "receives"
    
    COMPANY ||--o{ JOBS : "posts"
    
    JOBS ||--o{ APPLICATIONS : "receives"
    
    USER {
        text id PK
        text email UK
        text name
        text role "student|company|admin"
        boolean emailVerified
        timestamp createdAt
    }
    
    STUDENT {
        text id PK
        text userId FK
        text email
        text srn UK
        text cgpa
        text degree
        text course
        text[] skills
        jsonb education
        jsonb experience
        jsonb projects
        jsonb certifications
        jsonb resumes
        text status "pending|approved|rejected|banned"
        timestamp createdAt
    }
    
    COMPANY {
        text id PK
        text userId FK
        text name
        text industry
        text location
        text[] specialties
        text[] techStack
        boolean verified
        text status "pending|approved|rejected|banned"
        timestamp createdAt
    }
    
    JOBS {
        text id PK
        text companyId FK
        text title
        text type "internship|full-time"
        text cgpaCutoff
        text[] eligibleCourses
        text[] eligibleDegrees
        text[] skills
        text salary
        text status "active|stopped"
        jsonb analytics
        timestamp createdAt
    }
    
    APPLICATIONS {
        text id PK
        text jobId FK
        text studentId FK
        text status "pending|oa|interview|selected|rejected"
        text resumeUrl
        text coverLetter
        timestamp appliedAt
    }
    
    AI_QUERIES {
        text id PK
        text userId FK
        text role
        text query
        text generatedSql
        jsonb results
        text insights
        text chartType
        boolean isTemplate
        timestamp createdAt
    }
    
    ATS_SCANS {
        text id PK
        text studentId FK
        text resumeUrl
        text score
        jsonb analysis
        text[] matchedKeywords
        text[] missingKeywords
        jsonb suggestions
        timestamp createdAt
    }
    
    PROFILE_SUGGESTIONS {
        text id PK
        text studentId FK
        jsonb suggestions
        timestamp lastGenerated
    }
```

### 3. Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant M as Middleware
    participant BA as Better Auth
    participant DB as Database
    participant D as Dashboard
    
    U->>C: Visit /dashboard
    C->>M: Request
    
    M->>BA: Check Session
    alt No Session
        BA-->>M: No session
        M-->>C: Redirect to /login
        C-->>U: Show login page
    else Has Session
        BA-->>M: Session valid
        M->>DB: Get user profile
        
        alt Email not verified
            DB-->>M: emailVerified = false
            M-->>C: Redirect to /verify-email
        else No profile (student/company)
            DB-->>M: No profile found
            M-->>C: Redirect to /select-role
        else Profile pending/rejected
            DB-->>M: status = pending
            M-->>C: Redirect to /pending
        else Profile approved
            DB-->>M: status = approved
            M->>M: Check role-based routes
            alt Role mismatch
                M-->>C: Redirect to correct dashboard
            else Role matches
                M-->>C: Allow access
                C-->>U: Show dashboard
            end
        end
    end
```

### 4. NLP to SQL Complete Workflow

```mermaid
flowchart TD
    Start([User: Natural Language Query]) --> Input["'Show my top applications'"]
    
    Input --> QG[Query Generator<br/>lib/ai/query-generator.ts]
    
    QG --> Prompt{Build Context Prompt}
    Prompt --> |Include| Role[User Role: student/company/admin]
    Prompt --> |Include| Schema[Database Schema Info]
    Prompt --> |Include| Perms[Role Permissions]
    Prompt --> |Include| Examples[Array Handling Examples]
    
    Prompt --> Gemini[Gemini 2.0 Flash API]
    
    Gemini --> Response{Structured Response}
    Response --> |sql| SQL["SELECT * FROM applications<br/>ORDER BY applied_at DESC<br/>LIMIT 10"]
    Response --> |explanation| Exp["Retrieves your 10 most<br/>recent applications"]
    Response --> |chartType| Chart[table]
    Response --> |visualization| Viz["{xAxis, yAxis, groupBy}"]
    
    SQL --> Sanitize[Sanitize SQL<br/>Remove trailing semicolons]
    
    Sanitize --> Validate[SQL Validator<br/>lib/ai/sql-validator.ts]
    
    Validate --> Check1{Whitelist Check}
    Check1 --> |Pass| Check2{Blacklist Check}
    Check1 --> |Fail| Error1[Error: Only SELECT allowed]
    
    Check2 --> |Pass| Check3{Table Permission Check}
    Check2 --> |Fail| Error2[Error: Forbidden operation]
    
    Check3 --> |Pass| Check4{Sensitive Column Check}
    Check3 --> |Fail| Error3[Error: Access denied to table]
    
    Check4 --> |Pass| Filter[Add Role-Based Filters]
    Check4 --> |Fail| Error4[Error: Sensitive column]
    
    Filter --> Inject["Inject WHERE clause:<br/>applications.student_id = '{id}'"]
    
    Inject --> Execute[Query Executor<br/>server/ai/query-executor.ts]
    
    Execute --> Timeout{Execute with<br/>10s timeout}
    
    Timeout --> |Success| Results[Query Results<br/>JSON Array]
    Timeout --> |Timeout| Error5[Error: Query timeout]
    Timeout --> |DB Error| Error6[Error: Execution failed]
    
    Results --> Insights[Generate Insights<br/>via Gemini]
    
    Insights --> Save[Save to aiQueries table]
    
    Save --> Return{Return to Client}
    
    Return --> |success: true| Display[Display in UI:<br/>- Chart/Table<br/>- Insights<br/>- SQL Query<br/>- Execution Time]
    Return --> |success: false| ShowError[Display Error Message]
    
    Error1 & Error2 & Error3 & Error4 & Error5 & Error6 --> ShowError
    
    style Start fill:#e1f5ff
    style Gemini fill:#fff4e1
    style Validate fill:#ffebee
    style Execute fill:#e8f5e9
    style Display fill:#e1f5ff
    style ShowError fill:#ffcdd2
```

### 5. SQL Validation Security Layers

```mermaid
graph TD
    SQL[Generated SQL Query] --> Layer1[Layer 1: Basic Validation]
    
    Layer1 --> L1_1{Starts with SELECT<br/>or WITH?}
    L1_1 --> |No| Reject1[❌ Reject: Only SELECT allowed]
    L1_1 --> |Yes| L1_2{Multiple statements<br/>semicolons?}
    
    L1_2 --> |Yes| Reject2[❌ Reject: SQL injection attempt]
    L1_2 --> |No| L1_3{Contains SQL<br/>comments?}
    
    L1_3 --> |Yes| Reject3[❌ Reject: Comments not allowed]
    L1_3 --> |No| Layer2[Layer 2: Keyword Validation]
    
    Layer2 --> L2_1{Contains forbidden<br/>keywords?}
    L2_1 --> |Yes| Reject4["❌ Reject: DROP, DELETE,<br/>INSERT, UPDATE not allowed"]
    L2_1 --> |No| Layer3[Layer 3: Table Permissions]
    
    Layer3 --> L3_1[Extract table names<br/>FROM/JOIN clauses]
    L3_1 --> L3_2[Filter out:<br/>- PostgreSQL functions unnest<br/>- CTE names<br/>- Aliases]
    L3_2 --> L3_3{All tables<br/>allowed for role?}
    
    L3_3 --> |No| Reject5[❌ Reject: Access denied<br/>to table]
    L3_3 --> |Yes| Layer4[Layer 4: Column Security]
    
    Layer4 --> L4_1{Contains sensitive<br/>columns?}
    L4_1 --> |Yes| Reject6["❌ Reject: password, token,<br/>admin_note not allowed"]
    L4_1 --> |No| Layer5[Layer 5: Role-Based Filters]
    
    Layer5 --> L5_1{User Role?}
    L5_1 --> |Student| Student[Inject:<br/>WHERE student_id = 'X']
    L5_1 --> |Company| Company[Inject:<br/>WHERE company_id = 'Y']
    L5_1 --> |Admin| Admin[No filter needed]
    
    Student & Company & Admin --> Safe[✅ Safe to Execute]
    
    style SQL fill:#e3f2fd
    style Layer1 fill:#fff9c4
    style Layer2 fill:#fff9c4
    style Layer3 fill:#fff9c4
    style Layer4 fill:#fff9c4
    style Layer5 fill:#fff9c4
    style Safe fill:#c8e6c9
    style Reject1 fill:#ffcdd2
    style Reject2 fill:#ffcdd2
    style Reject3 fill:#ffcdd2
    style Reject4 fill:#ffcdd2
    style Reject5 fill:#ffcdd2
    style Reject6 fill:#ffcdd2
```

### 6. Role Permissions Matrix

```mermaid
graph LR
    subgraph "Student Permissions"
        S1[students<br/>✅ Own data only]
        S2[jobs<br/>✅ Active jobs only]
        S3[applications<br/>✅ Own applications]
        S4[companies<br/>✅ Basic info only]
        S5[user/account<br/>❌ Denied]
    end
    
    subgraph "Company Permissions"
        C1[companies<br/>✅ Own data only]
        C2[jobs<br/>✅ Own jobs only]
        C3[applications<br/>✅ Own job applications]
        C4[students<br/>✅ Applicants only]
        C5[user/account<br/>❌ Denied]
    end
    
    subgraph "Admin Permissions"
        A1[students<br/>✅ All data]
        A2[companies<br/>✅ All data]
        A3[jobs<br/>✅ All data]
        A4[applications<br/>✅ All data]
        A5[user<br/>✅ All except passwords]
        A6[aiQueries<br/>✅ All data]
        A7[account/session<br/>❌ Denied]
    end
    
    style S1 fill:#c8e6c9
    style S2 fill:#c8e6c9
    style S3 fill:#c8e6c9
    style S4 fill:#c8e6c9
    style S5 fill:#ffcdd2
    
    style C1 fill:#c8e6c9
    style C2 fill:#c8e6c9
    style C3 fill:#c8e6c9
    style C4 fill:#c8e6c9
    style C5 fill:#ffcdd2
    
    style A1 fill:#c8e6c9
    style A2 fill:#c8e6c9
    style A3 fill:#c8e6c9
    style A4 fill:#c8e6c9
    style A5 fill:#c8e6c9
    style A6 fill:#c8e6c9
    style A7 fill:#ffcdd2
```

### 7. Student Application Workflow

```mermaid
sequenceDiagram
    participant S as Student
    participant UI as Frontend
    participant API as API Route
    participant DB as Database
    participant Email as Email Service
    participant C as Company
    
    S->>UI: Browse Jobs (/dashboard/jobs)
    UI->>API: GET /api/student/jobs
    API->>DB: Query active jobs
    DB-->>API: Return jobs (filtered by eligibility)
    API-->>UI: Job listings
    UI-->>S: Display eligible jobs
    
    S->>UI: Click "Apply" on job
    UI->>UI: Show resume selector modal
    S->>UI: Select resume + write cover letter
    
    UI->>API: POST /api/student/applications
    API->>DB: Check eligibility:<br/>- CGPA >= cutoff<br/>- Course in eligible list<br/>- Not already applied
    
    alt Eligible
        DB-->>API: ✅ Eligible
        API->>DB: Create application record:<br/>- Snapshot student data<br/>- Link resume<br/>- Status: pending
        DB-->>API: Application created
        
        API->>DB: Update analytics:<br/>- student.applications++<br/>- job.applications++
        
        API-->>UI: Success response
        UI-->>S: "Application submitted!"
        
        API->>Email: Notify company (optional)
        Email-->>C: New application email
    else Not Eligible
        DB-->>API: ❌ Not eligible
        API-->>UI: Error: "You don't meet requirements"
        UI-->>S: Show error message
    end
```

### 8. ATS Resume Analysis Workflow

```mermaid
flowchart TD
    Start([Student uploads resume]) --> Upload[Upload to S3<br/>via presigned URL]
    
    Upload --> Trigger[Trigger ATS Analysis]
    
    Trigger --> Fetch[Fetch PDF from S3]
    
    Fetch --> Extract[Extract Text<br/>using pdf-parse]
    
    Extract --> Check{Job Description<br/>provided?}
    
    Check --> |Yes| PromptJD[Build Prompt:<br/>- Resume text<br/>- Job description<br/>- Compare keywords]
    Check --> |No| PromptGeneral[Build Prompt:<br/>- Resume text<br/>- General best practices]
    
    PromptJD & PromptGeneral --> Gemini[Gemini API Call]
    
    Gemini --> Parse{Parse Response}
    
    Parse --> Score[Overall Score: 0-100<br/>Based on actual quality]
    Parse --> Format[Formatting Score: 0-100<br/>- ATS compatibility<br/>- Structure issues]
    Parse --> Content[Content Score: 0-100<br/>- Action verbs<br/>- Achievements]
    Parse --> Keywords[Keyword Analysis:<br/>- Matched keywords<br/>- Missing keywords]
    Parse --> Feedback[Feedback:<br/>- Strengths<br/>- Weaknesses<br/>- Suggestions]
    
    Score & Format & Content & Keywords & Feedback --> Combine[Combine Analysis]
    
    Combine --> Save[Save to atsScans table]
    
    Save --> Display{Display Results}
    
    Display --> Visual[Visual Breakdown:<br/>📊 Score gauges<br/>✅ Strengths list<br/>❌ Weaknesses list<br/>💡 Suggestions<br/>🔍 Keywords]
    
    Visual --> End([Student views analysis])
    
    style Start fill:#e1f5ff
    style Gemini fill:#fff4e1
    style Save fill:#e8f5e9
    style End fill:#e1f5ff
```

### 9. Module Dependencies

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[UI Components<br/>components/*]
        Pages[Pages<br/>app/*]
    end
    
    subgraph "API Layer"
        Routes[API Routes<br/>app/api/*]
        Actions[Server Actions<br/>server/*]
    end
    
    subgraph "Core Libraries"
        Auth[Authentication<br/>lib/auth.ts]
        Storage[File Storage<br/>lib/storage.ts]
        Utils[Utilities<br/>lib/utils.ts]
    end
    
    subgraph "AI Module"
        Gemini[Gemini Client<br/>lib/ai/gemini-client.ts]
        QueryGen[Query Generator<br/>lib/ai/query-generator.ts]
        Validator[SQL Validator<br/>lib/ai/sql-validator.ts]
        Templates[Query Templates<br/>lib/ai/query-templates.ts]
        ATS[ATS Analyzer<br/>lib/ai/ats-analyzer.ts]
        Profile[Profile Analyzer<br/>lib/ai/profile-analyzer.ts]
    end
    
    subgraph "Business Logic"
        Students[Students Module<br/>server/students.ts]
        Companies[Companies Module<br/>server/companies.ts]
        Jobs[Jobs Module<br/>server/jobs.ts]
        Apps[Applications Module<br/>server/applications.ts]
        AIServer[AI Module<br/>server/ai/query-executor.ts]
    end
    
    subgraph "Data Layer"
        Schema[Database Schema<br/>db/schema.ts]
        Drizzle[Drizzle Client<br/>db/drizzle.ts]
        DB[(PostgreSQL)]
    end
    
    Pages --> Routes
    Pages --> Actions
    UI --> Routes
    UI --> Actions
    
    Routes --> Auth
    Actions --> Auth
    
    Routes --> Students & Companies & Jobs & Apps & AIServer
    Actions --> Students & Companies & Jobs & Apps & AIServer
    
    AIServer --> QueryGen & Validator & Templates
    QueryGen --> Gemini
    Validator --> Templates
    ATS --> Gemini
    Profile --> Gemini
    
    Students & Companies & Jobs & Apps --> Storage
    Students --> Profile & ATS
    
    Students & Companies & Jobs & Apps & AIServer --> Schema
    Schema --> Drizzle
    Drizzle --> DB
    
    style UI fill:#e1f5ff
    style Gemini fill:#fff4e1
    style DB fill:#e8f5e9
    style Auth fill:#fce4ec
```

### 10. Data Flow - Complete Journey

```mermaid
graph TD
    User[User Action] --> Entry{Entry Point}
    
    Entry --> |Click/Form| Client[Client Component]
    Entry --> |Navigation| Server[Server Component]
    
    Client --> APICall[API Call<br/>fetch/React Query]
    Server --> ServerAction[Server Action<br/>use server]
    
    APICall --> Route[API Route Handler<br/>app/api/*/route.ts]
    ServerAction --> Action[Server Function<br/>server/*.ts]
    
    Route --> Auth1[Check Authentication<br/>Better Auth]
    Action --> Auth2[Check Authentication<br/>Better Auth]
    
    Auth1 & Auth2 --> AuthCheck{Authenticated?}
    
    AuthCheck --> |No| Return401[Return 401<br/>Unauthorized]
    AuthCheck --> |Yes| AuthZ[Check Authorization<br/>Role + Ownership]
    
    AuthZ --> AuthZCheck{Authorized?}
    
    AuthZCheck --> |No| Return403[Return 403<br/>Forbidden]
    AuthZCheck --> |Yes| BizLogic[Business Logic]
    
    BizLogic --> NeedsAI{Needs AI?}
    
    NeedsAI --> |No| DBQuery[Database Query<br/>Drizzle ORM]
    NeedsAI --> |Yes| AIProcess[AI Processing]
    
    AIProcess --> AIType{AI Type}
    AIType --> |NLP Query| NLP[Query Generator +<br/>Validator]
    AIType --> |ATS Scan| ATSProc[ATS Analyzer]
    AIType --> |Profile| ProfileProc[Profile Analyzer]
    
    NLP & ATSProc & ProfileProc --> GeminiCall[Gemini API Call]
    GeminiCall --> AIResult[AI Result]
    
    AIResult --> DBQuery
    
    DBQuery --> DB[(PostgreSQL)]
    DB --> DBResult[Query Result]
    
    DBResult --> Transform[Transform Data]
    Transform --> Cache{Needs Caching?}
    
    Cache --> |Yes| SaveCache[Save to Cache<br/>Redis/Memory]
    Cache --> |No| Response[Build Response]
    SaveCache --> Response
    
    Response --> Return[Return to Client]
    
    Return --> ClientRender[Client Rendering]
    ClientRender --> UI[Update UI<br/>Display to User]
    
    Return401 & Return403 --> Error[Error Handling]
    Error --> UI
    
    style User fill:#e1f5ff
    style GeminiCall fill:#fff4e1
    style DB fill:#e8f5e9
    style UI fill:#e1f5ff
    style Return401 fill:#ffcdd2
    style Return403 fill:#ffcdd2
```

---

## Module Breakdown

### 1. Authentication Module (`lib/auth.ts`)

**Responsibilities:**
- User registration (email/password + Google OAuth)
- Session management (7-day sessions)
- Email verification
- Password reset
- Role assignment

**Key Functions:**
```typescript
auth.api.signIn()
auth.api.signUp()
auth.api.getSession()
auth.api.sendVerificationEmail()
auth.api.resetPassword()
```

**Flow:**
1. User signs up → Create user record
2. Send verification email (Resend)
3. User verifies → Set `emailVerified = true`
4. Redirect to `/select-role`
5. User selects role → Create profile (student/company)
6. Profile status: `pending` → Awaits admin approval

---

### 2. SQL Validator Module (`lib/ai/sql-validator.ts`)

**Core Security Functions:**

#### `validateSQL(sql: string, role: string): void`
- Checks for forbidden keywords (DROP, DELETE, etc.)
- Validates SELECT-only queries
- Checks table permissions
- Blocks sensitive columns

#### `addRoleBasedFilters(sql, role, context): string`
- Automatically injects WHERE clauses
- Handles CTEs (Common Table Expressions)
- Supports subqueries and aliases
- Prevents cross-user data access

**Permission Rules:**
```typescript
ROLE_PERMISSIONS = {
  student: {
    students: { 
      allowed: true, 
      conditions: "students.user_id = :currentUserId" 
    },
    jobs: { allowed: true, conditions: "jobs.status = 'active'" },
    applications: { 
      allowed: true, 
      conditions: "applications.student_id = :currentStudentId" 
    }
  },
  company: { /* similar */ },
  admin: { /* full access */ }
}
```

---

### 3. Query Generator Module (`lib/ai/query-generator.ts`)

**Core Function:**
```typescript
async function convertQueryToSQL(
  naturalQuery: string,
  role: "student" | "company" | "admin",
  context: { userId, studentId, companyId }
): Promise<QueryResponse>
```

**Process:**
1. Build context prompt with database schema
2. Include role permissions
3. Add PostgreSQL-specific examples (arrays, JSONB)
4. Send to Gemini with structured output schema
5. Parse response: `{ sql, explanation, chartType, visualization }`

**Database Schema Information:**
- Table definitions with column types
- Array column handling (TEXT[], JSONB)
- Common query patterns
- CGPA casting rules (TEXT → NUMERIC)

---

### 4. ATS Analyzer Module (`lib/ai/ats-analyzer.ts`)

**Core Function:**
```typescript
async function analyzeResumeATS(
  resumeUrl: string,
  jobDescription?: string
): Promise<ATSAnalysis>
```

**Analysis Components:**
- **Overall Score** (0-100): ATS compatibility rating
- **Formatting Score** (0-100): Structure, no columns/graphics
- **Content Score** (0-100): Action verbs, quantifiable achievements
- **Keyword Matching**: Present vs missing keywords (if JD provided)
- **Strengths**: 3-5 positive aspects
- **Weaknesses**: 3-5 areas for improvement
- **Suggestions**: 5-8 actionable recommendations

**Key Features:**
- Realistic scoring (uses full 0-100 range)
- PDF text extraction via `pdf-parse`
- Targeted analysis with job descriptions
- General best practices without JD

---

### 5. Profile Analyzer Module (`lib/ai/profile-analyzer.ts`)

**Core Function:**
```typescript
async function analyzeProfileGaps(
  studentId: string
): Promise<ProfileGap[]>
```

**Analysis Process:**
1. Fetch student profile data
2. Query active jobs for market insights
3. Extract top skills in demand
4. Calculate average requirements
5. Send to Gemini for gap analysis
6. Return 3-5 prioritized gaps with action items

**Gap Categories:**
- `projects`: Insufficient project portfolio
- `skills`: Missing in-demand technologies
- `certifications`: Industry credentials needed
- `experience`: Work experience gaps
- `education`: Missing courses/achievements

---

### 6. Peer Comparison Module (`lib/analytics/peer-comparison.ts`)

**Metrics Calculated:**

#### CGPA Comparison
```typescript
{
  yourCgpa: 8.5,
  average: 7.8,
  percentile: 75,  // Better than 75% of students
  rank: 12,        // 12th position
  total: 50        // Total students
}
```

#### Profile Completeness (100 points)
- Basic info (20): phone, CGPA, degree, course
- Skills (15): 0/5/10+ skills
- Projects (15): 0/2/3+ projects
- Experience (15): 0/1/2+ entries
- Certifications (10): 0/1/2+ certs
- Resume (10): uploaded
- Profile links (10): GitHub, LinkedIn, portfolio
- Bio (5): filled

---

## NLP to SQL Workflow (Detailed)

### Phase 1: Query Generation

**Input:**
```
Natural Query: "What are my top 5 skills compared to job requirements?"
Role: student
Context: { userId: "123", studentId: "456" }
```

**Prompt Construction:**
```
You are a PostgreSQL SQL expert...

USER ROLE: student
ALLOWED TABLES: students, jobs, applications, companies

DATABASE SCHEMA:
students:
  - skills (text[]) - use unnest(skills) to expand
jobs:
  - skills (text[]) - use unnest(skills) to expand

QUERY: "What are my top 5 skills compared to job requirements?"

REQUIREMENTS:
1. Generate valid PostgreSQL SELECT
2. Handle TEXT[] arrays with unnest()
3. Cast CGPA to NUMERIC for comparisons
4. Suggest appropriate chart type
```

**Gemini Response:**
```json
{
  "sql": "WITH my_skills AS (SELECT unnest(skills) as skill FROM students WHERE id = '{studentId}'), job_skills AS (SELECT unnest(skills) as skill FROM jobs WHERE status = 'active') SELECT my_skills.skill, COUNT(DISTINCT job_skills.skill) as demand FROM my_skills LEFT JOIN job_skills ON my_skills.skill = job_skills.skill GROUP BY my_skills.skill ORDER BY demand DESC LIMIT 5",
  "explanation": "This query finds your top 5 skills that are most in-demand across active job postings",
  "chartType": "bar",
  "visualization": {
    "xAxis": "skill",
    "yAxis": "demand",
    "groupBy": "skill"
  }
}
```

### Phase 2: SQL Validation

**Validation Steps:**
1. ✅ Starts with SELECT
2. ✅ No forbidden keywords (DROP, DELETE, etc.)
3. ✅ No multiple statements
4. ✅ No SQL comments
5. ✅ Extract tables: `students`, `jobs`
6. ✅ Check permissions: Student can access both
7. ✅ No sensitive columns referenced

### Phase 3: Filter Injection

**Before:**
```sql
SELECT unnest(skills) FROM students
```

**After (Role-Based Filter):**
```sql
SELECT unnest(skills) FROM students 
WHERE students.id = '456'
```

**Complex Query Example:**

**Before:**
```sql
WITH my_apps AS (
  SELECT * FROM applications
)
SELECT * FROM my_apps
```

**After:**
```sql
WITH my_apps AS (
  SELECT * FROM applications 
  WHERE applications.student_id = '456'
)
SELECT * FROM my_apps
```

### Phase 4: Execution & Insights

**Execution:**
```typescript
const result = await db.execute(sql.raw(modifiedSQL));
// With 10-second timeout
```

**Results:**
```json
[
  { skill: "React", demand: 25 },
  { skill: "Node.js", demand: 20 },
  { skill: "Python", demand: 18 },
  { skill: "TypeScript", demand: 15 },
  { skill: "AWS", demand: 12 }
]
```

**Insights Generation:**
```
Analyze the following data and provide 3-5 key insights...

DATA: [results]
```

**Gemini Insights:**
```markdown
- React is your most valuable skill, appearing in 25 job postings
- Full-stack combo of React + Node.js makes you competitive for 20+ positions
- Python and TypeScript are trending - great additions to your skillset
- AWS cloud experience is in high demand (12 postings)
- Consider adding Docker/Kubernetes to complement your AWS skills
```

---

## Security & Validation

### Multi-Layer Security Architecture

```
Layer 1: Middleware (Route Protection)
  ↓
Layer 2: Session Validation (Better Auth)
  ↓
Layer 3: Role Check (student/company/admin)
  ↓
Layer 4: Resource Ownership (userId/studentId/companyId)
  ↓
Layer 5: SQL Validation (Whitelist/Blacklist)
  ↓
Layer 6: Permission Matrix (Table access by role)
  ↓
Layer 7: Sensitive Column Blocking
  ↓
Layer 8: Role-Based Filter Injection
  ↓
Layer 9: Query Timeout (10 seconds)
  ↓
Execution ✅
```

### Common Attack Vectors & Protections

#### 1. SQL Injection
**Attack:**
```
User input: "'; DROP TABLE students; --"
```

**Protection:**
- Middleware blocks multiple statements (semicolon check)
- Validator rejects forbidden keywords (DROP)
- Validator blocks SQL comments (`--`)

#### 2. Unauthorized Table Access
**Attack:**
```
Student tries: "SELECT password FROM account"
```

**Protection:**
- Table permission check: Student cannot access `account` table
- Sensitive column check: `password` is blocked

#### 3. Cross-User Data Access
**Attack:**
```
Student tries: "SELECT * FROM students WHERE id != '456'"
```

**Protection:**
- Role-based filter injection automatically adds:
  `WHERE students.id = '456'`
- Student only sees their own data

#### 4. Privilege Escalation
**Attack:**
```
Company tries to access: "/dashboard/admin"
```

**Protection:**
- Middleware checks role before allowing route access
- Redirects company to `/dashboard/company`

---

## Performance Optimizations

### Database Indexing
```sql
CREATE INDEX idx_students_status_created_at ON students(status, created_at DESC);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_ai_queries_user_id ON ai_queries(user_id);
```

### Caching Strategy
- **React Query**: Client-side caching with stale-while-revalidate
- **Query Results**: Store in `aiQueries` table for history
- **Profile Suggestions**: Cached in `profileSuggestions` table

### Serverless Scaling
- **Neon PostgreSQL**: Auto-scaling serverless database
- **Vercel Edge**: Global CDN for static assets
- **AWS S3 + CloudFront**: Resume file delivery

---

## API Endpoints Summary

### Student APIs
- `POST /api/student/profile` - Update profile
- `GET /api/student/jobs` - Browse jobs
- `POST /api/student/applications` - Apply to job
- `POST /api/student/ats-scan` - Analyze resume
- `GET /api/student/peer-comparison` - Compare with peers
- `GET /api/student/profile-suggestions` - Get improvement suggestions

### Company APIs
- `POST /api/company/profile` - Update company profile
- `POST /api/company/jobs` - Create job posting
- `GET /api/company/applications` - View applications
- `PATCH /api/company/applications/:id` - Update application status

### Admin APIs
- `GET /api/admin/students` - List all students
- `GET /api/admin/companies` - List all companies
- `PATCH /api/admin/students/:id` - Approve/reject student
- `PATCH /api/admin/companies/:id` - Approve/reject company

### AI APIs
- `POST /api/ai/query` - Execute natural language query
- `GET /api/ai/query` - Get query history
- `DELETE /api/ai/query` - Clear history
- `GET /api/ai/templates` - Get query templates

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Production Stack                  │
└─────────────────────────────────────────────────────┘

Frontend:              Vercel (Next.js)
  ├─ Edge Network:     Global CDN
  ├─ Build:            Turbopack
  └─ Region:           Auto (closest to user)

Database:              Neon (PostgreSQL Serverless)
  ├─ Connection:       Pooling enabled
  ├─ Backups:          Automatic daily
  └─ Region:           us-east-1

File Storage:          AWS S3
  ├─ Bucket:           Private (presigned URLs)
  ├─ CDN:              CloudFront (optional)
  └─ Region:           us-east-1

AI Service:            Google Gemini
  ├─ Model:            gemini-2.0-flash-exp
  ├─ Rate Limit:       60 RPM
  └─ Timeout:          10 seconds

Email Service:         Resend
  ├─ Provider:         AWS SES
  ├─ Domain:           Custom (if configured)
  └─ Templates:        React Email

Analytics:             Vercel Analytics
  └─ Web Vitals:       Core performance metrics
```

---

## Key Takeaways

✅ **Security-First Design**: Multi-layer validation prevents SQL injection, unauthorized access, and data leaks

✅ **AI-Powered Intelligence**: Gemini integration for NLP queries, resume analysis, and profile insights

✅ **Role-Based Architecture**: Separate workflows for students, companies, and admins

✅ **Scalable Infrastructure**: Serverless database, S3 storage, edge CDN

✅ **Type-Safe Development**: TypeScript + Drizzle ORM + Zod validation

✅ **Modern Stack**: Next.js 15, React 19, TailwindCSS 4, Gemini 2.0

---

**GitHired** is production-ready with enterprise-grade security, AI-powered analytics, and a scalable architecture! 🚀

