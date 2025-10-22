# AI Analytics Assistant - Setup & Usage Guide

## Overview

The AI Analytics Assistant is an intelligent analytics system that allows users to query data using natural language. It's powered by Google Gemini AI and provides role-based insights with interactive visualizations.

## Features

### Core Capabilities
- **Natural Language Queries**: Ask questions in plain English
- **Pre-built Templates**: Quick access to common analytics queries
- **Interactive Visualizations**: Bar charts, line charts, pie charts, radar charts, and tables
- **Role-Based Access**: Different capabilities for Students, Companies, and Admins
- **Query History**: Track and revisit previous queries
- **Smart Suggestions**: AI-powered recommendations based on your data
- **Data Export**: Download query results as CSV

### Keyboard Shortcut
- Press `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux) to open the AI Assistant from anywhere

## Environment Setup

### Required Environment Variables

Add the following to your `.env` file:

```bash
# Google Gemini API Key (Required for AI features)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional AI Configuration
NEXT_PUBLIC_AI_ENABLED=true
AI_RATE_LIMIT_PER_MIN=10
AI_QUERY_TIMEOUT_MS=10000
```

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the generated API key
5. Add it to your `.env` file as `GEMINI_API_KEY`

**Note:** Gemini API has a generous free tier, making it cost-effective for development and moderate usage.

## Usage by Role

### For Students

**Available Templates:**
1. **CGPA Comparison** - See where your CGPA ranks among peers
2. **In-Demand Skills** - Skills most frequently required in jobs
3. **Application Success Rate** - Breakdown of your application statuses
4. **Profile Strength Analysis** - Multi-dimensional profile assessment
5. **Best Job Matches** - Jobs that match your profile
6. **Application Timeline** - Track your applications over time

**Example Questions:**
- "How many students have a higher CGPA than me?"
- "What skills should I learn to improve my job matches?"
- "Show me jobs I'm eligible for but haven't applied to"
- "What's my selection rate compared to other students?"

**Smart Suggestions:**
- Jobs you're eligible for but haven't applied to
- Profile completion recommendations
- Application success rate insights
- CGPA improvement impact analysis

### For Companies

**Available Templates:**
1. **Application Statistics** - Overview of all your job applications
2. **Applicant CGPA Distribution** - CGPA breakdown of candidates
3. **Top Skills in Pool** - Most common skills among applicants
4. **Hiring Funnel** - Application to selection conversion rates
5. **Job Performance** - Compare performance across postings
6. **Course Distribution** - Applicants breakdown by course

**Example Questions:**
- "Which of my jobs has the best applicant quality?"
- "What's the average CGPA of students applying to my jobs?"
- "Show me the skills gap between requirements and applicants"
- "How many applications convert to interviews?"

**Smart Suggestions:**
- Application rate optimization tips
- CGPA cutoff recommendations
- Hiring funnel efficiency insights
- Job posting frequency suggestions

### For Admins

**Available Templates:**
1. **Platform Overview** - Comprehensive platform statistics
2. **Registration Trends** - Student vs company growth over time
3. **Job Posting Activity** - Job posting trends
4. **Success by Course** - Placement rates by course
5. **Active Companies** - Most active companies leaderboard
6. **CGPA vs Success** - Correlation analysis
7. **Application Status Distribution** - Platform-wide status breakdown
8. **Salary Insights** - Salary distribution analysis

**Example Questions:**
- "Which companies are hiring most actively?"
- "What's the overall platform engagement this month?"
- "Show me courses with low placement rates"
- "What's the average time from application to selection?"

**Smart Suggestions:**
- Pending approvals notifications
- Platform engagement insights
- Application rate monitoring
- Growth opportunities identification

## Security & Privacy

### Role-Based Access Control
- **Students**: Can only see their own data and public job information
- **Companies**: Can only see their jobs and applicants to those jobs
- **Admins**: Have access to all platform data (except sensitive auth data)

### SQL Validation
All AI-generated queries are validated to ensure:
- Only SELECT operations are allowed (no data modification)
- Role-based table access restrictions are enforced
- Sensitive columns (passwords, tokens) are blocked
- Query execution is limited to 10 seconds max
- Rate limiting: 10 queries per minute per user

### Data Protection
- Passwords and authentication tokens are never exposed
- Email addresses are filtered based on role permissions
- Admin notes and internal comments are protected
- All queries are logged for audit purposes

## Technical Architecture

### Components

#### Backend
- **`lib/ai/gemini-client.ts`** - Gemini API integration
- **`lib/ai/query-generator.ts`** - Natural language to SQL conversion
- **`lib/ai/query-templates.ts`** - Pre-built query templates
- **`lib/ai/sql-validator.ts`** - Security validation layer
- **`lib/ai/suggestions.ts`** - Smart suggestions engine
- **`server/ai/query-executor.ts`** - Query execution and orchestration

#### Frontend
- **`components/ai-assistant-modal.tsx`** - Main UI component
- **`components/charts/dynamic-chart.tsx`** - Visualization engine

#### API Endpoints
- `POST /api/ai/query` - Execute AI queries
- `GET /api/ai/query` - Fetch query history
- `DELETE /api/ai/query` - Clear query history
- `GET /api/ai/templates` - Get role-based templates
- `GET /api/ai/suggestions` - Get smart suggestions

#### Database Tables
- **`ai_queries`** - Query history and results
- **`query_templates`** - Template definitions (currently code-based)

### Chart Types

The system automatically selects appropriate visualizations:

- **Metric** - Single number or key metrics display
- **Bar Chart** - Comparisons and distributions
- **Line Chart** - Trends over time
- **Pie Chart** - Proportions and percentages
- **Radar Chart** - Multi-dimensional comparisons
- **Funnel Chart** - Conversion and progression tracking
- **Table** - Detailed data with sorting

## API Costs

### Gemini API Pricing (as of 2024)

**Free Tier:**
- 60 queries per minute
- 1,500 queries per day
- Perfect for development and small-scale usage

**Paid Tier** (if needed):
- ~$0.001 - $0.005 per query
- Extremely affordable compared to OpenAI GPT-4

**Estimated Costs:**
- 100 queries/day = ~$0.10 - $0.50/day
- 1,000 queries/day = ~$1 - $5/day

## Troubleshooting

### Common Issues

**1. "Failed to generate AI response"**
- Check if `GEMINI_API_KEY` is set correctly
- Verify API key is valid at Google AI Studio
- Check internet connectivity
- Review rate limits (60 queries/min)

**2. "Query timeout"**
- Query took longer than 10 seconds
- Try simplifying the question
- Use templates instead of free-form queries

**3. "Access denied to table"**
- Trying to access data outside role permissions
- Use templates which are pre-validated
- Ensure you're querying allowed tables for your role

**4. "SQL injection detected"**
- Query contains forbidden keywords (DROP, DELETE, etc.)
- Rephrase question to be more natural
- Use templates for complex queries

### Debug Mode

Check browser console and server logs for detailed error messages:
```bash
# Server logs will show:
✅ Status update email sent...
Executing SQL: SELECT...
Gemini API Error: ...
```

## Future Enhancements

Planned features for future releases:

1. **Predictive Analytics** - "What's my probability of selection at Company X?"
2. **Voice Input** - Ask questions using voice commands
3. **Custom Dashboards** - Save and customize visualization layouts
4. **Multi-Query Workflows** - Chain multiple related queries
5. **Anomaly Detection** - Automatic alerts for unusual patterns
6. **AI Resume Optimization** - Analyze resume against job requirements
7. **Benchmarking Dashboards** - Industry-standard comparisons
8. **Query Sharing** - Share insights with teams

## Support

For issues or questions:
1. Check this README
2. Review the codebase documentation
3. Check Gemini API status at [Google AI Studio](https://makersuite.google.com/)

## License

This feature is part of the GitHired platform.

