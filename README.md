# Job Portal - Student Profile & Admin Management System

A modern, minimalist job portal built with Next.js 15, focusing on student profile management and admin verification workflows.

## 🎯 Overview

This application provides a streamlined platform for students to create and manage their professional profiles, while administrators can review, approve, reject, or ban student accounts. The system includes secure resume uploads, SRN validation, and comprehensive profile management.

## ✨ Features

### For Students
- **Profile Creation**: Comprehensive profile with education, experience, projects, skills, and more
- **Resume Upload**: Secure resume storage using DigitalOcean Spaces (S3-compatible)
- **SRN Validation**: Student Registration Number validation and verification
- **Status Tracking**: Real-time profile approval status
- **Analytics**: Track profile views and application metrics
- **Placement Status**: Mark intern and full-time placement status

### For Administrators
- **Student Management**: View, filter, and manage all student profiles
- **Approval Workflow**: Approve, reject, ban, or unban students
- **SRN Verification**: Manually verify student registration numbers
- **Cursor Pagination**: Efficient browsing of large student lists
- **Statistics Dashboard**: Overview of pending, approved, rejected, and banned students
- **Resume Access**: View student resumes directly from the admin panel

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **UI**: Shadcn UI + Tailwind CSS
- **Storage**: DigitalOcean Spaces (S3-compatible)
- **Email**: Resend
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database (Neon, Supabase, or local)
- DigitalOcean Spaces account (or any S3-compatible storage)
- Resend API key (for emails)
- Google OAuth credentials (optional)

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd next
npm install
# or
bun install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=your_postgres_connection_string

# Better Auth
BETTER_AUTH_SECRET=your_random_secret_key_here
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Resend (Email)
RESEND_API_KEY=your_resend_api_key

# DigitalOcean Spaces
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_KEY=your_spaces_access_key
DO_SPACES_SECRET=your_spaces_secret_key
DO_SPACES_BUCKET=your_bucket_name
DO_SPACES_CDN_ENDPOINT=https://your-cdn-endpoint.com
```

### 3. Database Setup

```bash
# Generate migrations
npx drizzle-kit generate

# Push to database
npx drizzle-kit push
```

### 4. Create Admin User

After signing up through the app:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```

### 5. Run Development Server

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── admin/             # Admin endpoints
│   │   └── student/           # Student endpoints
│   ├── dashboard/             # Protected dashboard
│   │   ├── admin/            # Admin dashboard
│   │   ├── pending/          # Pending approval page
│   │   ├── profile/edit/     # Profile editor
│   │   └── jobs/             # Job listings (placeholder)
│   ├── login/                # Login page
│   └── signup/               # Signup page
├── components/               # React components
│   ├── forms/               # Form components
│   └── ui/                  # UI components (Shadcn)
├── db/                      # Database
│   ├── drizzle.ts          # DB client
│   └── schema.ts           # Database schema
├── lib/                     # Utilities
│   ├── auth.ts             # Auth configuration
│   ├── auth-client.ts      # Client-side auth
│   ├── storage.ts          # DigitalOcean Spaces
│   └── utils.ts            # Helper functions
├── server/                  # Server actions
│   ├── admin.ts            # Admin operations
│   ├── students.ts         # Student operations
│   └── users.ts            # User operations
└── middleware.ts           # Route protection
```

## 🔐 Authentication Flow

1. **Student Signup**
   - User signs up → Account created with `student` role
   - Student profile auto-created with `pending` status
   - Redirected to pending page

2. **Pending State**
   - Student can edit profile and upload resume
   - Admin reviews and approves/rejects
   - Student receives notification

3. **Approved State**
   - Full dashboard access
   - Can browse jobs and update profile
   - Profile visible to companies (future feature)

4. **Admin Access**
   - Manual role assignment in database
   - Access to admin dashboard at `/dashboard/admin`
   - Can manage all students

## 🗄️ Database Schema

### User Table
```typescript
{
  id: string (PK)
  name: string
  email: string (unique)
  emailVerified: boolean
  image: string?
  role: 'student' | 'admin' (default: 'student')
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Students Table
```typescript
{
  id: string (PK)
  userId: string (FK → user.id, unique)
  srn: string? (unique)
  srnValid: boolean (default: false)
  phone: string?
  email: string
  location: string?
  preferredLocations: string[]
  bio: string?
  aboutMe: string?
  headline: string?
  education: jsonb
  experience: jsonb
  projects: jsonb
  certifications: jsonb
  achievements: jsonb
  skills: string[]
  githubUrl: string?
  linkedinUrl: string?
  portfolioUrl: string?
  leetcodeUrl: string?
  otherPlatforms: jsonb
  analytics: jsonb
  placedIntern: boolean
  placedFte: boolean
  resumeUrl: string?
  status: 'pending' | 'approved' | 'rejected' | 'banned'
  adminNote: string?
  createdAt: timestamp
  updatedAt: timestamp
}
```

## 🔌 API Endpoints

### Student Endpoints

- `GET /api/student/profile` - Get current user's profile
- `PUT /api/student/profile` - Update profile
- `POST /api/student/resume/presigned-url` - Get upload URL

### Admin Endpoints

- `GET /api/admin/students` - List students (with filters & pagination)
- `GET /api/admin/students?action=stats` - Get statistics
- `GET /api/admin/students/[id]` - Get student by ID
- `POST /api/admin/students/[id]/approve` - Approve student
- `POST /api/admin/students/[id]/reject` - Reject student
- `POST /api/admin/students/[id]/ban` - Ban student
- `POST /api/admin/students/[id]/unban` - Unban student
- `POST /api/admin/students/[id]/verify-srn` - Verify SRN

## 🎨 UI Components

The project uses Shadcn UI components with a minimalist, modern design:

- Cards
- Buttons
- Forms
- Input fields
- Dialogs
- Alert dialogs
- Skeletons
- Toasts (Sonner)
- Sidebar navigation

## 🔒 Security Features

- Session-based authentication
- Role-based access control (RBAC)
- SRN format validation
- Presigned URL uploads (15-minute expiration)
- CSRF protection
- Prepared SQL statements (Drizzle ORM)
- Email verification

## 📊 Admin Dashboard

The admin dashboard provides:

- **Statistics Cards**: Total, pending, approved, rejected, banned counts
- **Filter Tabs**: Quick filtering by status
- **Student Cards**: Compact view with key info
- **Inline Actions**: Approve, reject, ban, unban, verify SRN
- **Resume Preview**: Open resume in new tab
- **Pagination**: Load more with cursor-based pagination

## 🎓 Student Dashboard

Students see:

- **Profile Completion**: Progress bar with checklist
- **Analytics**: Profile views and application count
- **Quick Actions**: Edit profile, browse jobs
- **Placement Status**: Intern/FTE badges

## 🚧 Future Enhancements

- [ ] Company module (accounts, job postings)
- [ ] Job application system
- [ ] Email notifications (on status changes)
- [ ] Advanced analytics
- [ ] Bulk admin operations
- [ ] External SRN verification API
- [ ] Student data export
- [ ] Resume parsing
- [ ] Interview scheduling

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check network connectivity
- Ensure database accepts connections

### Resume Upload Failing
- Verify DigitalOcean Spaces credentials
- Check CORS settings on bucket
- Ensure bucket has public-read ACL

### Admin Not Working
- Verify user role is set to `'admin'` in database
- Clear browser cache and cookies
- Check middleware logs

## 📝 License

This project is private and confidential.

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

---

**Built with ❤️ using Next.js 15, TypeScript, and modern web technologies.**
