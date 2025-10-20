# Quick Start Guide

Get your Job Portal up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Database

1. Create a PostgreSQL database (use Neon, Supabase, or local Postgres)
2. Copy your connection string

## Step 3: Configure Environment

Create `.env` file:

```env
DATABASE_URL=postgresql://user:password@host:5432/database

BETTER_AUTH_SECRET=generate_random_string_here
BETTER_AUTH_URL=http://localhost:3000

RESEND_API_KEY=re_xxxxxxxxxxxx

# DigitalOcean Spaces (get from DO console)
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_KEY=your_key
DO_SPACES_SECRET=your_secret
DO_SPACES_BUCKET=your_bucket_name
```

### Quick Env Setup Tips

**BETTER_AUTH_SECRET**: Generate using:
```bash
openssl rand -base64 32
```

**DigitalOcean Spaces**:
1. Go to https://cloud.digitalocean.com/spaces
2. Create a new Space
3. Generate API keys in Settings → API
4. Copy endpoint, region, and bucket name

**Resend API**:
1. Sign up at https://resend.com
2. Get API key from dashboard

## Step 4: Initialize Database

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

## Step 5: Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## Step 6: Create Admin User

1. Sign up through the app at http://localhost:3000/signup
2. Open your database (e.g., Neon dashboard)
3. Run this SQL:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'your-email@example.com';
```

4. Refresh the page and go to `/dashboard/admin`

## 🎉 You're Ready!

### Test the Flow

1. **As Student**:
   - Sign up at `/signup`
   - Complete profile at `/dashboard/profile/edit`
   - Upload resume (PDF only)
   - Add SRN, skills, links
   - See pending status at `/dashboard/pending`

2. **As Admin**:
   - Log in with admin account
   - Go to `/dashboard/admin`
   - See pending students
   - Approve/reject students
   - Verify SRN

### Quick Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npx drizzle-kit generate  # Generate migrations
npx drizzle-kit push      # Push to database
npx drizzle-kit studio    # Open database studio
```

## Common Issues

### "Can't connect to database"
- Check `DATABASE_URL` format
- Ensure database is running
- Verify network/firewall settings

### "Resume upload fails"
- Verify DO Spaces credentials
- Check bucket CORS settings
- Ensure bucket is public-read

### "Admin dashboard not accessible"
- Verify role is set to `'admin'` in database
- Clear cookies and try again
- Check middleware logs

## Next Steps

1. ✅ Set up email templates (edit `components/emails/`)
2. ✅ Customize SRN validation (edit `server/students.ts`)
3. ✅ Update branding (logo, colors, text)
4. ✅ Configure production environment
5. ✅ Set up monitoring and logging

## Need Help?

- Check `SETUP.md` for detailed configuration
- Check `MIGRATION_SUMMARY.md` for technical details
- Check `README.md` for full documentation

---

Happy coding! 🚀

