# GitHired - Complete System Architecture Diagram

```mermaid
flowchart TB
    subgraph CLIENT["🖥️ CLIENT LAYER"]
        UI[Next.js Frontend<br/>React 19 Components]
        Pages[Pages: app/*<br/>- /login<br/>- /signup<br/>- /dashboard<br/>- /dashboard/admin<br/>- /dashboard/company]
        Components[UI Components<br/>- Forms<br/>- Charts Recharts<br/>- Tables<br/>- Modals]
    end

    subgraph ROUTING["🛣️ ROUTING & MIDDLEWARE"]
        NextRouter[Next.js Router]
        MW[MIDDLEWARE<br/>middleware.ts]
        MW1{1. Session Check}
        MW2{2. Email Verified?}
        MW3{3. Profile Exists?}
        MW4{4. Profile Status?}
        MW5{5. Role-Based Route}
        
        MWR1[❌ → /login]
        MWR2[❌ → /verify-email]
        MWR3[❌ → /select-role]
        MWR4[⏸️ → /pending]
        MWR5[✅ Allow Access]
    end

    subgraph AUTH["🔐 AUTHENTICATION - Better Auth"]
        AuthAPI[Better Auth API<br/>lib/auth.ts]
        AuthMethods[Methods:<br/>- signUp email/password<br/>- signUp OAuth Google<br/>- signIn<br/>- signOut<br/>- getSession<br/>- resetPassword]
        
        AuthDB[(Auth Tables:<br/>- user<br/>- session<br/>- account<br/>- verification)]
        
        AuthEmail[Email Service<br/>Resend]
        AuthEmails[- Verification Email<br/>- Password Reset<br/>- New Job Alert<br/>- Status Update]
    end

    subgraph API["🔌 API LAYER"]
        APIRoutes[API Routes<br/>app/api/*/route.ts]
        ServerActions[Server Actions<br/>server/*.ts]
        
        subgraph APIS["API Endpoints"]
            AuthRoutes[/api/auth/[...all]<br/>Better Auth]
            StudentAPI[/api/student/*<br/>- profile<br/>- jobs<br/>- applications<br/>- ats-scan<br/>- peer-comparison<br/>- profile-suggestions<br/>- resume]
            CompanyAPI[/api/company/*<br/>- profile<br/>- jobs<br/>- applications]
            AdminAPI[/api/admin/*<br/>- students<br/>- companies<br/>- jobs<br/>- applications]
            AIAPI[/api/ai/*<br/>- query<br/>- suggestions<br/>- templates]
        end
    end

    subgraph BUSINESS["💼 BUSINESS LOGIC LAYER"]
        subgraph MODULES["Server Modules"]
            StudentsModule[Students Module<br/>server/students.ts<br/><br/>- getStudentProfile<br/>- createStudentProfile<br/>- updateStudentProfile<br/>- validateSRN]
            
            CompaniesModule[Companies Module<br/>server/companies.ts<br/><br/>- getCompanyProfile<br/>- createCompanyProfile<br/>- updateCompanyProfile<br/>- verifyCompany]
            
            JobsModule[Jobs Module<br/>server/jobs.ts<br/><br/>- createJob<br/>- updateJob<br/>- deleteJob<br/>- getJobs<br/>- notifyEligibleStudents]
            
            AppsModule[Applications Module<br/>server/applications.ts<br/><br/>- createApplication<br/>- updateApplicationStatus<br/>- getApplications<br/>- checkEligibility]
            
            UsersModule[Users Module<br/>server/users.ts<br/><br/>- getUserByEmail<br/>- updateUserRole<br/>- deleteUser]
            
            AdminModule[Admin Module<br/>server/admin.ts<br/><br/>- approveStudent<br/>- approveCompany<br/>- rejectProfile<br/>- banUser<br/>- platformStats]
        end
        
        Auth1{Auth Check:<br/>getSession}
        Auth2{Role Check:<br/>student/company/admin}
        Auth3{Ownership Check:<br/>userId match}
    end

    subgraph AI["🤖 AI MODULE"]
        AIServer[AI Server<br/>server/ai/query-executor.ts<br/><br/>- executeAIQuery<br/>- getQueryHistory<br/>- clearHistory]
        
        subgraph AICORE["AI Core Libraries"]
            GeminiClient[Gemini Client<br/>lib/ai/gemini-client.ts<br/><br/>Model: gemini-2.0-flash-exp<br/>- generateCompletion<br/>- generateStructuredResponse]
            
            QueryGen[Query Generator<br/>lib/ai/query-generator.ts<br/><br/>NLP → SQL Conversion<br/>- convertQueryToSQL<br/>- generateInsights<br/>- generateSuggestions]
            
            SQLVal[SQL Validator<br/>lib/ai/sql-validator.ts<br/><br/>SECURITY LAYERS:<br/>════════════════]
            
            Val1[Layer 1: Basic Validation<br/>✓ Starts with SELECT/WITH<br/>✓ No multiple statements<br/>✓ No SQL comments]
            
            Val2[Layer 2: Keyword Check<br/>✓ Whitelist: SELECT, FROM, WHERE, JOIN, etc.<br/>✗ Blacklist: DROP, DELETE, INSERT, UPDATE, ALTER, CREATE]
            
            Val3[Layer 3: Table Permissions<br/>✓ Extract table names<br/>✓ Filter out: PostgreSQL functions unnest, CTE names<br/>✓ Validate against role permissions]
            
            Val4[Layer 4: Sensitive Columns<br/>✗ Block: password, token, secret, admin_note]
            
            Val5[Layer 5: Role-Based Filters<br/>✓ Student: WHERE student_id = 'X'<br/>✓ Company: WHERE company_id = 'Y'<br/>✓ Admin: No filter all access]
            
            Val6[Layer 6: Sanitization<br/>✓ Remove trailing semicolons<br/>✓ Clean whitespace]
            
            PermMatrix[Permission Matrix<br/>ROLE_PERMISSIONS:<br/><br/>STUDENT:<br/>- students: own only<br/>- jobs: active only<br/>- applications: own only<br/>- companies: basic info<br/><br/>COMPANY:<br/>- companies: own only<br/>- jobs: own only<br/>- applications: own jobs<br/>- students: applicants only<br/><br/>ADMIN:<br/>- All tables except:<br/>  account, session, verification]
            
            Templates[Query Templates<br/>lib/ai/query-templates.ts<br/><br/>Student: 10 templates<br/>Company: 9 templates<br/>Admin: 12 templates<br/><br/>Categories:<br/>- Profile Analysis<br/>- Market Insights<br/>- Application Stats<br/>- Hiring Analytics<br/>- Platform Stats]
            
            ATSAnalyzer[ATS Analyzer<br/>lib/ai/ats-analyzer.ts<br/><br/>- analyzeResumeATS<br/>- quickATSScore<br/><br/>Process:<br/>1. Fetch PDF from S3<br/>2. Extract text pdf-parse<br/>3. Build prompt<br/>4. Gemini analysis<br/>5. Return scores 0-100<br/><br/>Output:<br/>- Overall score<br/>- Formatting score<br/>- Content score<br/>- Keyword matches<br/>- Missing keywords<br/>- Strengths<br/>- Weaknesses<br/>- Suggestions]
            
            ProfileAnalyzer[Profile Analyzer<br/>lib/ai/profile-analyzer.ts<br/><br/>- analyzeProfileGaps<br/><br/>Process:<br/>1. Get student profile<br/>2. Get market insights<br/>3. Compare & analyze<br/>4. Gemini gap detection<br/><br/>Output: 3-5 gaps<br/>- category<br/>- priority<br/>- actionItems]
            
            PeerComp[Peer Comparison<br/>lib/analytics/peer-comparison.ts<br/><br/>- generatePeerComparison<br/><br/>Metrics:<br/>- CGPA percentile<br/>- Applications vs avg<br/>- Success rate<br/>- Skills comparison<br/>- Profile completeness]
        end
        
        AIAuth{AI Auth Check}
        AINLP[NLP Query Input]
        AIValidate{SQL Validation<br/>Pass?}
        AIExecute[Execute SQL<br/>10s timeout]
        AIInsights[Generate Insights<br/>via Gemini]
        AISave[Save to aiQueries]
    end

    subgraph STORAGE["💾 STORAGE LAYER"]
        S3Module[AWS S3 Module<br/>lib/storage.ts<br/><br/>- generatePresignedUploadUrl<br/>- getPublicUrl<br/><br/>Bucket: resumes/<br/>Key: userId/timestamp-filename<br/>Expiry: 15 minutes<br/>CDN: CloudFront optional]
        
        S3Client[AWS S3 Client<br/>@aws-sdk/client-s3]
        S3Bucket[(S3 Bucket<br/>Private Access<br/>Presigned URLs)]
    end

    subgraph DATABASE["🗄️ DATABASE LAYER"]
        Drizzle[Drizzle ORM<br/>db/drizzle.ts]
        Schema[Database Schema<br/>db/schema.ts]
        
        subgraph TABLES["PostgreSQL Tables"]
            UserTable[(user<br/>────────<br/>id PK<br/>email UK<br/>name<br/>role<br/>emailVerified<br/>createdAt)]
            
            SessionTable[(session<br/>────────<br/>id PK<br/>userId FK<br/>token UK<br/>expiresAt)]
            
            StudentTable[(students<br/>────────<br/>id PK<br/>userId FK UK<br/>srn UK<br/>cgpa<br/>degree<br/>course<br/>skills text[]<br/>education jsonb<br/>experience jsonb<br/>projects jsonb<br/>certifications jsonb<br/>resumes jsonb<br/>status<br/>createdAt<br/><br/>Indexes:<br/>- status_created_at)]
            
            CompanyTable[(companies<br/>────────<br/>id PK<br/>userId FK UK<br/>name<br/>industry<br/>location<br/>specialties text[]<br/>techStack text[]<br/>verified bool<br/>status<br/>createdAt<br/><br/>Indexes:<br/>- status_created_at)]
            
            JobTable[(jobs<br/>────────<br/>id PK<br/>companyId FK<br/>title<br/>type<br/>location<br/>cgpaCutoff<br/>eligibleCourses text[]<br/>eligibleDegrees text[]<br/>skills text[]<br/>salary<br/>status<br/>analytics jsonb<br/>createdAt<br/><br/>Indexes:<br/>- company_id<br/>- status_created_at)]
            
            AppTable[(applications<br/>────────<br/>id PK<br/>jobId FK<br/>studentId FK<br/>status<br/>resumeUrl<br/>coverLetter<br/>appliedAt<br/><br/>Indexes:<br/>- job_id<br/>- student_id<br/>- job_student unique)]
            
            AIQTable[(aiQueries<br/>────────<br/>id PK<br/>userId FK<br/>role<br/>query NL<br/>generatedSql<br/>results jsonb<br/>insights<br/>chartType<br/>isTemplate<br/>executionTime<br/>createdAt<br/><br/>Indexes:<br/>- user_id<br/>- role<br/>- created_at)]
            
            ATSTable[(atsScans<br/>────────<br/>id PK<br/>studentId FK<br/>resumeUrl<br/>score<br/>analysis jsonb<br/>matchedKeywords text[]<br/>missingKeywords text[]<br/>suggestions jsonb<br/>createdAt<br/><br/>Indexes:<br/>- student_id<br/>- created_at)]
            
            SuggestTable[(profileSuggestions<br/>────────<br/>id PK<br/>studentId FK UK<br/>suggestions jsonb<br/>lastGenerated<br/>updatedAt<br/><br/>Indexes:<br/>- student_id)]
            
            TemplateTable[(queryTemplates<br/>────────<br/>id PK<br/>role<br/>category<br/>name<br/>description<br/>prompt<br/>chartType<br/>isActive<br/>sortOrder<br/>createdAt<br/><br/>Indexes:<br/>- role<br/>- category)]
        end
        
        NeonDB[(Neon PostgreSQL<br/>═══════════════<br/>Serverless<br/>Auto-scaling<br/>Connection Pooling<br/>Daily Backups<br/>Region: us-east-1)]
    end

    subgraph EXTERNAL["🌐 EXTERNAL SERVICES"]
        Gemini[Google Gemini API<br/>═══════════════<br/>Model: gemini-2.0-flash-exp<br/>Rate Limit: 60 RPM<br/>Timeout: 10 seconds<br/><br/>Use Cases:<br/>- NLP to SQL<br/>- Resume Analysis<br/>- Profile Gap Detection<br/>- Insights Generation<br/>- Suggestions]
        
        Resend[Resend Email API<br/>═══════════════<br/>Provider: AWS SES<br/>React Email Templates<br/><br/>Email Types:<br/>- Verification<br/>- Password Reset<br/>- New Job Notification<br/>- Application Status]
        
        GoogleOAuth[Google OAuth<br/>═══════════════<br/>Client ID + Secret<br/>Scopes: email, profile<br/>Auto-verify email]
        
        AWS[AWS Services<br/>═══════════════<br/>S3: File storage<br/>CloudFront: CDN optional<br/>Region: us-east-1]
    end

    subgraph FLOWS["📊 CRITICAL WORKFLOWS"]
        subgraph FLOW1["1️⃣ AUTHENTICATION FLOW"]
            F1_1[User Sign Up] --> F1_2[Create User Record]
            F1_2 --> F1_3{OAuth or Email?}
            F1_3 -->|OAuth| F1_4[Auto Verify Email]
            F1_3 -->|Email| F1_5[Send Verification Email]
            F1_5 --> F1_6[User Clicks Link]
            F1_6 --> F1_4
            F1_4 --> F1_7[Redirect: /select-role]
            F1_7 --> F1_8[User Selects Role]
            F1_8 --> F1_9[Create Profile]
            F1_9 --> F1_10[Status: Pending]
            F1_10 --> F1_11[Admin Approval]
            F1_11 --> F1_12[Status: Approved]
            F1_12 --> F1_13[Access Dashboard]
        end
        
        subgraph FLOW2["2️⃣ NLP QUERY FLOW"]
            F2_1[Natural Language Input] --> F2_2[Query Generator]
            F2_2 --> F2_3[Build Context Prompt]
            F2_3 --> F2_4[Send to Gemini]
            F2_4 --> F2_5[Receive: SQL + Metadata]
            F2_5 --> F2_6[Sanitize SQL]
            F2_6 --> F2_7[Validate SQL: 6 Layers]
            F2_7 --> F2_8{Valid?}
            F2_8 -->|No| F2_9[Return Error]
            F2_8 -->|Yes| F2_10[Inject Role Filters]
            F2_10 --> F2_11[Execute Query 10s timeout]
            F2_11 --> F2_12[Generate Insights]
            F2_12 --> F2_13[Save to aiQueries]
            F2_13 --> F2_14[Return: Data + Insights + Chart]
        end
        
        subgraph FLOW3["3️⃣ JOB APPLICATION FLOW"]
            F3_1[Student Views Job] --> F3_2[Click Apply]
            F3_2 --> F3_3[Check Eligibility]
            F3_3 --> F3_4{CGPA ≥ Cutoff?}
            F3_4 -->|No| F3_5[Show Error]
            F3_4 -->|Yes| F3_6{Course Eligible?}
            F3_6 -->|No| F3_5
            F3_6 -->|Yes| F3_7{Degree Eligible?}
            F3_7 -->|No| F3_5
            F3_7 -->|Yes| F3_8{Already Applied?}
            F3_8 -->|Yes| F3_5
            F3_8 -->|No| F3_9[Select Resume]
            F3_9 --> F3_10[Submit Application]
            F3_10 --> F3_11[Create Application Record]
            F3_11 --> F3_12[Update Analytics]
            F3_12 --> F3_13[Notify Company Optional]
            F3_13 --> F3_14[Success Message]
        end
        
        subgraph FLOW4["4️⃣ ATS RESUME SCAN FLOW"]
            F4_1[Student Uploads Resume] --> F4_2[Generate Presigned URL]
            F4_2 --> F4_3[Direct Upload to S3]
            F4_3 --> F4_4[Trigger ATS Analysis]
            F4_4 --> F4_5[Fetch PDF from S3]
            F4_5 --> F4_6[Extract Text: pdf-parse]
            F4_6 --> F4_7[Build Analysis Prompt]
            F4_7 --> F4_8[Send to Gemini]
            F4_8 --> F4_9[Parse Structured Response]
            F4_9 --> F4_10[Save to atsScans]
            F4_10 --> F4_11[Display Results]
        end
        
        subgraph FLOW5["5️⃣ MIDDLEWARE PROTECTION"]
            F5_1[Request to /dashboard] --> F5_2[Middleware Intercept]
            F5_2 --> F5_3[Check Session]
            F5_3 --> F5_4{Session Exists?}
            F5_4 -->|No| F5_5[→ /login]
            F5_4 -->|Yes| F5_6[Check Email Verified]
            F5_6 --> F5_7{Verified?}
            F5_7 -->|No| F5_8[→ /verify-email]
            F5_7 -->|Yes| F5_9[Check Profile Exists]
            F5_9 --> F5_10{Profile?}
            F5_10 -->|No| F5_11[→ /select-role]
            F5_10 -->|Yes| F5_12[Check Profile Status]
            F5_12 --> F5_13{Status?}
            F5_13 -->|Pending/Rejected| F5_14[→ /pending]
            F5_13 -->|Banned| F5_14
            F5_13 -->|Approved| F5_15[Check Role vs Route]
            F5_15 --> F5_16{Match?}
            F5_16 -->|No| F5_17[Redirect to Correct Dashboard]
            F5_16 -->|Yes| F5_18[✅ Allow Access]
        end
    end

    %% CLIENT CONNECTIONS
    UI --> Pages
    Pages --> Components
    Pages --> NextRouter
    NextRouter --> MW

    %% MIDDLEWARE FLOW
    MW --> MW1
    MW1 -->|No Session| MWR1
    MW1 -->|Has Session| MW2
    MW2 -->|Not Verified| MWR2
    MW2 -->|Verified| MW3
    MW3 -->|No Profile| MWR3
    MW3 -->|Has Profile| MW4
    MW4 -->|Pending/Rejected| MWR4
    MW4 -->|Approved| MW5
    MW5 -->|Role Match| MWR5
    MW5 -->|Role Mismatch| MWR1
    
    MWR5 --> APIRoutes
    MWR5 --> ServerActions

    %% AUTH CONNECTIONS
    MW1 --> AuthAPI
    AuthAPI --> AuthMethods
    AuthMethods --> AuthDB
    AuthMethods --> AuthEmail
    AuthEmail --> AuthEmails
    AuthEmails --> Resend
    AuthMethods --> GoogleOAuth
    GoogleOAuth --> AuthAPI

    %% API ROUTING
    APIRoutes --> AuthRoutes
    APIRoutes --> StudentAPI
    APIRoutes --> CompanyAPI
    APIRoutes --> AdminAPI
    APIRoutes --> AIAPI
    
    AuthRoutes --> AuthAPI
    
    %% API TO BUSINESS LOGIC
    StudentAPI --> Auth1
    CompanyAPI --> Auth1
    AdminAPI --> Auth1
    AIAPI --> Auth1
    ServerActions --> Auth1
    
    Auth1 -->|Valid| Auth2
    Auth1 -->|Invalid| MWR1
    Auth2 -->|Valid Role| Auth3
    Auth2 -->|Invalid Role| MWR1
    Auth3 -->|Authorized| StudentsModule
    Auth3 -->|Authorized| CompaniesModule
    Auth3 -->|Authorized| JobsModule
    Auth3 -->|Authorized| AppsModule
    Auth3 -->|Authorized| UsersModule
    Auth3 -->|Authorized| AdminModule
    Auth3 -->|Authorized| AIServer

    %% BUSINESS LOGIC TO DATABASE
    StudentsModule --> Drizzle
    CompaniesModule --> Drizzle
    JobsModule --> Drizzle
    AppsModule --> Drizzle
    UsersModule --> Drizzle
    AdminModule --> Drizzle

    %% DRIZZLE TO TABLES
    Drizzle --> Schema
    Schema --> UserTable
    Schema --> SessionTable
    Schema --> StudentTable
    Schema --> CompanyTable
    Schema --> JobTable
    Schema --> AppTable
    Schema --> AIQTable
    Schema --> ATSTable
    Schema --> SuggestTable
    Schema --> TemplateTable
    
    %% TABLES TO NEON
    UserTable --> NeonDB
    SessionTable --> NeonDB
    StudentTable --> NeonDB
    CompanyTable --> NeonDB
    JobTable --> NeonDB
    AppTable --> NeonDB
    AIQTable --> NeonDB
    ATSTable --> NeonDB
    SuggestTable --> NeonDB
    TemplateTable --> NeonDB

    %% AI WORKFLOW
    AIServer --> AIAuth
    AIAuth -->|Valid| AINLP
    AINLP --> QueryGen
    QueryGen --> GeminiClient
    GeminiClient --> Gemini
    Gemini --> QueryGen
    QueryGen --> SQLVal
    
    SQLVal --> Val1
    Val1 --> Val2
    Val2 --> Val3
    Val3 --> PermMatrix
    PermMatrix --> Val3
    Val3 --> Val4
    Val4 --> Val5
    Val5 --> Val6
    Val6 --> AIValidate
    
    AIValidate -->|Pass| AIExecute
    AIValidate -->|Fail| UI
    
    AIExecute --> Drizzle
    AIExecute --> AIInsights
    AIInsights --> GeminiClient
    AIInsights --> AISave
    AISave --> AIQTable
    
    QueryGen --> Templates
    Templates --> QueryGen

    %% ATS & PROFILE ANALYZER
    ATSAnalyzer --> GeminiClient
    ATSAnalyzer --> S3Module
    ATSAnalyzer --> ATSTable
    
    ProfileAnalyzer --> GeminiClient
    ProfileAnalyzer --> StudentTable
    ProfileAnalyzer --> JobTable
    ProfileAnalyzer --> SuggestTable
    
    PeerComp --> StudentTable
    PeerComp --> AppTable

    %% STORAGE CONNECTIONS
    StudentsModule --> S3Module
    CompaniesModule --> S3Module
    S3Module --> S3Client
    S3Client --> S3Bucket
    S3Bucket --> AWS

    %% EMAIL CONNECTIONS
    JobsModule --> AuthEmail
    AppsModule --> AuthEmail

    %% STYLING
    style CLIENT fill:#e1f5ff,stroke:#01579b,stroke-width:3px
    style ROUTING fill:#fff3e0,stroke:#e65100,stroke-width:3px
    style AUTH fill:#fce4ec,stroke:#880e4f,stroke-width:3px
    style API fill:#f3e5f5,stroke:#4a148c,stroke-width:3px
    style BUSINESS fill:#e8f5e9,stroke:#1b5e20,stroke-width:3px
    style AI fill:#fff4e1,stroke:#ff6f00,stroke-width:3px
    style STORAGE fill:#e0f2f1,stroke:#004d40,stroke-width:3px
    style DATABASE fill:#e8eaf6,stroke:#1a237e,stroke-width:3px
    style EXTERNAL fill:#fce4ec,stroke:#880e4f,stroke-width:3px
    style FLOWS fill:#fff9c4,stroke:#f57f17,stroke-width:3px
    
    style MW fill:#ff6b6b,stroke:#c92a2a,stroke-width:2px
    style AuthAPI fill:#fa5252,stroke:#e03131,stroke-width:2px
    style SQLVal fill:#ff6b6b,stroke:#c92a2a,stroke-width:2px
    style PermMatrix fill:#ffa94d,stroke:#fd7e14,stroke-width:2px
    style GeminiClient fill:#ffd43b,stroke:#fab005,stroke-width:2px
    style NeonDB fill:#51cf66,stroke:#37b24d,stroke-width:2px
    style Gemini fill:#ffd43b,stroke:#fab005,stroke-width:2px
```

