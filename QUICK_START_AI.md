# AI Analytics Assistant - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Gemini API Key

1. Visit https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

### Step 2: Add to Environment

Add to your `.env` file:
```bash
GEMINI_API_KEY=paste_your_key_here
```

### Step 3: Restart Your Development Server

```bash
npm run dev
# or
bun dev
```

### Step 4: Test It Out

1. Log in to your application
2. Press `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux)
3. AI Assistant modal should open
4. Click any template or type a question
5. See the magic! ✨

## 📱 How to Use

### Via Keyboard Shortcut
```
Cmd/Ctrl + K → Opens AI Assistant
```

### Via Sidebar
Click the "AI Assistant" button in the sidebar (shows ⌘K hint)

## 💡 Example Queries

### For Students
```
"How does my CGPA compare to other students?"
"What skills are most in-demand?"
"Show me my application success rate"
"Which jobs match my profile best?"
```

### For Companies
```
"Show me application statistics for my jobs"
"What's the average CGPA of my applicants?"
"Show my hiring funnel conversion rates"
"Which job has the best applicant quality?"
```

### For Admins
```
"Give me platform overview statistics"
"Show student vs company registration trends"
"What's the success rate by course?"
"Show me the most active companies"
```

## 🎨 Features at a Glance

✅ **20 Pre-built Templates** - Instant insights with one click
✅ **Natural Language Queries** - Ask anything about your data
✅ **7 Chart Types** - Bar, line, pie, radar, funnel, table, metrics
✅ **Smart Suggestions** - AI-powered recommendations
✅ **Query History** - Review and reuse previous queries
✅ **CSV Export** - Download data for further analysis
✅ **Role-Based Access** - Secure, appropriate data for each user

## 🔒 Security Notes

- Only SELECT queries allowed (no data modification)
- Role-based table access (students can't see company data)
- Sensitive data filtered (passwords, tokens, etc.)
- 10 queries per minute rate limit
- 10 second query timeout

## 🐛 Troubleshooting

### "Failed to generate AI response"
→ Check if `GEMINI_API_KEY` is set in `.env`
→ Verify API key is valid at Google AI Studio
→ Check console for detailed error

### "Access denied to table"
→ You're trying to access data outside your role permissions
→ Use pre-built templates instead

### "Query timeout"
→ Query took longer than 10 seconds
→ Try a simpler question or use a template

## 📊 Cost Information

**Gemini API Free Tier:**
- 60 queries per minute
- 1,500 queries per day
- FREE for most use cases!

**Paid Tier** (if you exceed free tier):
- ~$0.001-0.005 per query
- Very affordable!

## 🎯 Best Practices

1. **Start with Templates** - Pre-built queries are optimized
2. **Be Specific** - "Show CGPA distribution by course" vs "Show me stats"
3. **Use History** - Revisit useful queries without re-running
4. **Export Data** - Download for deeper analysis in Excel
5. **Check Suggestions** - AI recommendations are personalized

## 📚 Full Documentation

For detailed information, see:
- `AI_ANALYTICS_README.md` - Complete user guide
- `AI_IMPLEMENTATION_SUMMARY.md` - Technical implementation details

## ✅ You're All Set!

Press `Cmd/Ctrl + K` and start exploring your data with AI! 🚀

---

**Need Help?** Check the README files or console logs for debugging.

