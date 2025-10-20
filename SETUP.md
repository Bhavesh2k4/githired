# Job Portal Setup Guide

## Overview
This application has been converted from a note-taking app to a Job Portal with student profiles and admin management.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=your_postgres_connection_string

# Better Auth
BETTER_AUTH_SECRET=your_random_secret_key_here
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Resend (Email)
RESEND_API_KEY=your_resend_api_key

# DigitalOcean Spaces (S3-compatible storage for resume uploads)
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_KEY=your_do_spaces_access_key
DO_SPACES_SECRET=your_do_spaces_secret_key
DO_SPACES_BUCKET=your_bucket_name
DO_SPACES_CDN_ENDPOINT=https://your-cdn-endpoint.com (optional)
```

## Database Setup

### 1. Run Drizzle Migrations

```bash
npm install
npx drizzle-kit generate
npx drizzle-kit push
```

### 2. Create an Admin User

After running migrations, you need to manually create an admin user in your database:

**Option 1: Using SQL**
```sql
-- First, sign up through the app to create a user
-- Then update that user's role to 'admin':
UPDATE "user" SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```

**Option 2: Sign up and manually update in database UI**
1. Sign up through the app normally
2. Go to your database (e.g., Neon, Supabase, etc.)
3. Find your user in the `user` table
4. Change the `role` field from `student` to `admin`

## Features

### Student Flow
1. **Signup** → Creates account with `student` role and `pending` status
2. **Pending Page** → Student sees waiting message until admin approves
3. **Profile Edit** → Students can complete their profile while pending
4. **Dashboard** → After approval, students access the main dashboard

### Admin Flow
1. **Admin Dashboard** → Access at `/dashboard/admin`
2. **Student Management**:
   - View all students with filtering (pending, approved, rejected, banned)
   - Approve/reject student profiles
   - Ban/unban students
   - Verify SRN (Student Registration Number)
   - View student resumes

### SRN Validation
- Format: `PES1UG20CS001` (customizable in `server/students.ts`)
- Must be unique
- Admin can manually verify SRN

### Resume Upload
- Uses DigitalOcean Spaces (S3-compatible)
- Presigned URL flow for secure uploads
- Only PDF files allowed

## API Routes

### Student Endpoints
- `GET /api/student/profile` - Get current student's profile
- `PUT /api/student/profile` - Update student profile
- `POST /api/student/resume/presigned-url` - Get presigned URL for resume upload

### Admin Endpoints
- `GET /api/admin/students?status=pending&cursor=xxx` - List students (paginated)
- `GET /api/admin/students?action=stats` - Get student statistics
- `GET /api/admin/students/[id]` - Get student by ID
- `POST /api/admin/students/[id]/approve` - Approve student
- `POST /api/admin/students/[id]/reject` - Reject student
- `POST /api/admin/students/[id]/ban` - Ban student
- `POST /api/admin/students/[id]/unban` - Unban student
- `POST /api/admin/students/[id]/verify-srn` - Verify SRN

## Database Schema

### Students Table
```sql
CREATE TABLE students (
  id text PRIMARY KEY,
  user_id text UNIQUE NOT NULL REFERENCES user(id),
  srn text UNIQUE,
  srn_valid boolean DEFAULT false,
  phone text,
  email text NOT NULL,
  location text,
  preferred_locations text[],
  bio text,
  about_me text,
  headline text,
  education jsonb,
  experience jsonb,
  projects jsonb,
  certifications jsonb,
  achievements jsonb,
  skills text[],
  github_url text,
  linkedin_url text,
  portfolio_url text,
  leetcode_url text,
  other_platforms jsonb,
  analytics jsonb,
  placed_intern boolean DEFAULT false,
  placed_fte boolean DEFAULT false,
  resume_url text,
  status text DEFAULT 'pending', -- pending | approved | rejected | banned
  admin_note text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### User Table Updates
Added `role` field:
- `student` (default)
- `admin`

## Next Steps

### To Implement Later
- Company module (ignored per requirements)
- Job postings and applications
- Email notifications for status changes
- Advanced SRN validation with external API
- Student analytics dashboard
- Export student data

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Notes

- The rich text editor component has been kept for future use
- UI remains minimalist and modern as per original design
- All student profile fields are optional except email
- Resume uploads require DigitalOcean Spaces configuration
- Admin users are managed manually in the database

