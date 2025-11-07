# GitHired - Complete Pseudocode (200 Lines)

## MODULE 1: DATABASE SCHEMA (db/schema.ts)
```
TABLE user:
  id, name, email, emailVerified, image, role(student|company|admin), timestamps

TABLE session:
  id, token, expiresAt(7 days), ipAddress, userAgent, userId(FK)

TABLE students:
  id, userId(FK), name, email, college, graduationYear, cgpa, 
  skills[], bio, resume(S3), status(pending|approved|rejected|banned)

TABLE companies:
  id, userId(FK), name, description, industry, size, website, logo,
  status(pending|approved|rejected|banned)

TABLE jobs:
  id, companyId(FK), title, description, requirements, location, type,
  salary, openings, deadline, status(active|closed)

TABLE applications:
  id, jobId(FK), studentId(FK), resume(S3), coverLetter,
  status(pending|reviewed|shortlisted|rejected|accepted), appliedAt

TABLE aiQueries:
  id, userId, role, query(NLP), generatedSQL, isValid, result(JSON),
  insights(AI), createdAt

TABLE atsScans:
  id, studentId(FK), resume(S3), score(0-100), keywords[], 
  gaps[], suggestions[], jobId(optional), createdAt

TABLE queryTemplates:
  id, role, category, question, sqlQuery, description
```

## MODULE 2: MIDDLEWARE (middleware.ts)
```
FUNCTION middleware(request):
  session = auth.getSession()
  IF NOT session THEN REDIRECT /login
  
  user = db.getUserById(session.userId)
  IF NOT user THEN REDIRECT /login
  
  // Email Verification Check
  IF NOT user.emailVerified AND NOT onVerifyEmailPage THEN
    REDIRECT /verify-email
  
  // Profile Existence Check
  profile = db.getProfile(user.id, user.role)
  IF NOT profile THEN REDIRECT /select-role
  
  // Role-Based Routing
  SWITCH user.role:
    CASE "admin":
      IF NOT onAdminDashboard THEN REDIRECT /dashboard/admin
    
    CASE "company":
      IF profile.status == "banned" THEN RESTRICT to /pending
      IF profile.status IN ["pending", "rejected"] THEN RESTRICT to /pending + /profile/edit
      IF profile.status == "approved" THEN ALLOW /dashboard/company/*
    
    CASE "student":
      IF profile.status == "banned" THEN RESTRICT to /pending
      IF profile.status IN ["pending", "rejected"] THEN RESTRICT to /pending + /profile/edit
      IF profile.status == "approved" THEN ALLOW /dashboard/*
  
  RETURN next()
```

## MODULE 3: AUTHENTICATION (lib/auth.ts)
```
CLASS BetterAuth:
  FUNCTION signup(email, password, name):
    user = createUser(email, password, name, role="student", emailVerified=false)
    token = generateVerificationToken(user)
    sendVerificationEmail(email, token)
    RETURN user
  
  FUNCTION login(email, password):
    user = findUserByEmail(email)
    IF NOT verifyPassword(password, user.password) THEN ERROR
    session = createSession(user, expiresIn=7days)
    RETURN session
  
  FUNCTION googleOAuth():
    googleUser = authenticateWithGoogle()
    user = findOrCreateUser(googleUser.email, emailVerified=true)
    session = createSession(user)
    RETURN session
  
  FUNCTION verifyEmail(token):
    user = getUserByToken(token)
    IF tokenExpired THEN ERROR
    user.emailVerified = true
    db.update(user)
  
  FUNCTION logout(sessionId):
    db.deleteSession(sessionId)
```

## MODULE 4: STUDENT API (app/api/student/*)
```
API /student/profile [GET, PATCH]:
  user = authenticate()
  IF GET:
    profile = db.students.findOne({userId: user.id})
    RETURN profile
  IF PATCH:
    validateInput(body)
    db.students.update({userId: user.id}, body)
    RETURN updatedProfile

API /student/jobs [GET]:
  filters = {status: "active", ...query.filters}
  jobs = db.jobs.findMany(filters)
  FOR EACH job ADD company details
  RETURN jobs

API /student/applications [POST, GET]:
  IF POST:
    validateEligibility(job, student)
    resume = uploadToS3(file)
    application = db.applications.create({jobId, studentId, resume})
    notifyCompany(application)
    RETURN application
  IF GET:
    applications = db.applications.findMany({studentId: user.id})
    RETURN applications with job details

API /student/ats-scan [POST]:
  resume = uploadToS3(file)
  text = extractPDFText(resume)
  result = AI.analyzeResume(text, jobDescription?)
  score = calculateATSScore(result)
  db.atsScans.create({studentId, resume, score, ...result})
  RETURN {score, keywords, gaps, suggestions}

API /student/profile-suggestions [GET]:
  profile = db.students.findOne({userId: user.id})
  result = AI.analyzeProfile(profile)
  RETURN {gaps, improvements, marketInsights}

API /student/peer-comparison [POST]:
  myProfile = db.students.findOne({userId: user.id})
  peers = db.students.findMany({college: myProfile.college, graduationYear})
  comparison = comparePeerMetrics(myProfile, peers)
  RETURN {ranking, avgCGPA, avgSkills, insights}
```

## MODULE 5: COMPANY API (app/api/company/*)
```
API /company/profile [GET, PATCH]:
  user = authenticate()
  IF GET:
    profile = db.companies.findOne({userId: user.id})
    RETURN profile
  IF PATCH:
    db.companies.update({userId: user.id}, body)
    RETURN updatedProfile

API /company/jobs [POST, GET, PATCH, DELETE]:
  IF POST:
    validateInput(body)
    job = db.jobs.create({companyId: user.companyId, ...body})
    notifyMatchingStudents(job)
    RETURN job
  IF GET:
    jobs = db.jobs.findMany({companyId: user.companyId})
    RETURN jobs with application counts
  IF PATCH:
    db.jobs.update({id: jobId, companyId}, body)
  IF DELETE:
    db.jobs.delete({id: jobId, companyId})

API /company/applications [GET, PATCH]:
  IF GET:
    applications = db.applications
      .join(jobs).where({companyId: user.companyId})
    RETURN applications with student details
  IF PATCH:
    db.applications.update({id: appId}, {status: newStatus})
    notifyStudent(application, newStatus)
    RETURN application
```

## MODULE 6: ADMIN API (app/api/admin/*)
```
API /admin/students [GET]:
  students = db.students.findMany()
  RETURN students with user details

API /admin/companies [GET]:
  companies = db.companies.findMany()
  RETURN companies with user details

API /admin/approve [POST]:
  {entityType, entityId} = body
  IF entityType == "student":
    db.students.update({id: entityId}, {status: "approved"})
  ELSE IF entityType == "company":
    db.companies.update({id: entityId}, {status: "approved"})
  notifyUser(entityId, "approved")

API /admin/reject [POST]:
  updateStatus(entityType, entityId, "rejected")
  notifyUser(entityId, "rejected", reason)

API /admin/jobs [GET]:
  jobs = db.jobs.findMany() with company details
  RETURN jobs with analytics
```

## MODULE 7: AI QUERY ENGINE (lib/ai/query-generator.ts)
```
FUNCTION executeNLPQuery(naturalQuery, userId, role):
  // Step 1: Get Template or Generate SQL
  template = findMatchingTemplate(naturalQuery, role)
  IF template:
    sql = template.sqlQuery
  ELSE:
    sql = AI.generateSQL(naturalQuery, schema, role)
  
  // Step 2: Validate SQL (6 Layers)
  validator = new SQLValidator()
  validation = validator.validate(sql, role):
    CHECK onlySelectQueries
    CHECK noDropDeleteTruncate
    CHECK allowedTablesForRole
    CHECK noSensitiveColumns(password, token)
    CHECK rowLevelSecurity(own data only)
    CHECK injectionPatterns
  
  IF NOT validation.isValid THEN
    RETURN {error: validation.errors}
  
  // Step 3: Add Role-Based Filters
  sql = addRoleFilters(sql, userId, role):
    IF role == "student": WHERE studentId = userId
    IF role == "company": WHERE companyId = userCompanyId
    IF role == "admin": no restriction
  
  // Step 4: Execute Query
  result = db.raw(sql)
  
  // Step 5: Generate Insights
  insights = AI.generateInsights(result, naturalQuery)
  
  // Step 6: Store History
  db.aiQueries.create({userId, role, query: naturalQuery, sql, result, insights})
  
  RETURN {result, insights, sql}
```

## MODULE 8: AI SERVICES (lib/ai/*)
```
CLASS ATSAnalyzer:
  FUNCTION analyzeResume(pdfBuffer, jobDescription?):
    text = extractPDFText(pdfBuffer)
    prompt = buildATSPrompt(text, jobDescription)
    analysis = Generate(prompt)
    RETURN {
      score: 0-100,
      keywords: extracted[],
      gaps: missing[],
      suggestions: improvements[]
    }

CLASS ProfileAnalyzer:
  FUNCTION analyzeProfile(studentProfile):
    prompt = buildProfilePrompt(profile)
    analysis = Generate(prompt)
    RETURN {
      gaps: [skill, experience, project areas],
      improvements: [actionable suggestions],
      marketInsights: [demand, trends]
    }
```

## MODULE 9: FILE STORAGE (lib/storage.ts)
```
CLASS S3Storage:
  FUNCTION uploadResume(file, userId):
    key = `resumes/${userId}/${timestamp}-${filename}`
    s3.upload(bucket, key, file)
    RETURN s3Url
  
  FUNCTION getPresignedUrl(key):
    url = s3.getSignedUrl(key, expiresIn=15minutes)
    RETURN url
  
  FUNCTION deleteFile(key):
    s3.delete(bucket, key)
```

## MODULE 10: QUERY TEMPLATES (31 Pre-built)
```
TEMPLATES BY ROLE:
  Student (10): top companies, matching jobs, application stats, peer comparison
  Company (9): candidate pool, application pipeline, job analytics, hiring trends
  Admin (12): platform stats, approval queue, user growth, system health

EXAMPLE:
  {
    role: "student",
    category: "job_search",
    question: "Which companies are hiring most actively?",
    sql: "SELECT c.name, COUNT(j.id) as jobs FROM companies c JOIN jobs j..."
  }
```



