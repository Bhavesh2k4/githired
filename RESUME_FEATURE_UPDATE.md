# Resume Feature Update - Multiple Resume Variants

## Overview
This update adds support for students to upload and manage multiple resume variants (up to 3) for different job roles, plus adds a dark/light mode toggle to the sidebar.

## Features Added

### 1. **Dark/Light Mode Toggle in Sidebar** 🌓
- **Location**: Bottom of sidebar, next to user info
- **Access**: Available for both students and admins
- **Options**: Light, Dark, System
- **Benefit**: Users can now switch themes without going to homepage

### 2. **Multiple Resume Variants** 📄
- **Student Benefits**:
  - Upload up to 3 different resumes
  - Label each resume (e.g., "Software Engineer", "Data Analyst", "Frontend Developer")
  - View uploaded resumes directly from profile
  - Delete old resumes and upload new variants
  - Each resume shows upload date

- **Admin Benefits**:
  - View all student resume variants
  - Quick preview of resume count in student cards
  - Click to view each resume variant in profile dialog

## Database Changes

### New Column Added
```sql
ALTER TABLE students 
ADD COLUMN resumes JSONB DEFAULT '[]';
```

**Structure**:
```typescript
resumes: Array<{
  label: string;
  url: string;
  uploadedAt: string;
}>
```

**Note**: The old `resumeUrl` field is kept for backward compatibility.

## Migration Steps

### 1. Update Database Schema
**✅ MIGRATION ALREADY APPLIED!**

The database migration has been automatically applied. The migration file is:
- `migrations/0001_romantic_skin.sql`

Migration SQL:
```sql
ALTER TABLE "students" ADD COLUMN "resumes" jsonb;
```

### 2. (Optional) Migrate Existing Resumes
If you have existing resumes in `resumeUrl`, you can migrate them:

```sql
UPDATE students 
SET resumes = jsonb_build_array(
  jsonb_build_object(
    'label', 'Resume',
    'url', resume_url,
    'uploadedAt', created_at::text
  )
)
WHERE resume_url IS NOT NULL 
  AND (resumes IS NULL OR resumes = '[]'::jsonb);
```

### 3. Restart Your Application
```bash
# If using bun
bun run dev

# If using npm
npm run dev
```

## File Changes

### Modified Files
1. `/db/schema.ts` - Added `resumes` field
2. `/app/dashboard/profile/edit/page.tsx` - Multi-resume upload UI
3. `/app/dashboard/admin/page.tsx` - Admin view for multiple resumes
4. `/app/dashboard/page.tsx` - Student dashboard resume check
5. `/components/app-sidebar.tsx` - Refactored for client-side theme toggle
6. `/components/sidebar-footer.tsx` - **NEW** - Client component for footer

### New Features in Profile Edit
- **Resume Label Input**: Students must provide a label before upload
- **Resume List**: Shows all uploaded resumes with labels and dates
- **View Button**: Opens resume in new tab
- **Delete Button**: Remove individual resume variants
- **Upload Limit**: Max 3 resumes with helpful message

### Admin Dashboard Updates
- Student cards show resume count (e.g., "2 resumes uploaded")
- Profile dialog displays all resume variants
- Each resume shows label, upload date, and view button
- Quick access to first resume from student card

## User Flow

### Student Upload Flow
1. Go to Profile Edit
2. Scroll to "Resumes" section
3. Enter a descriptive label (e.g., "Full Stack Developer")
4. Click "Upload Resume" and select PDF
5. Resume appears in list with view/delete options
6. Repeat for up to 3 variants

### Admin View Flow
1. Open Admin Dashboard
2. Click "View Profile" on any student
3. Scroll to "Resumes" section
4. See all uploaded resume variants
5. Click "View" on any resume to open in new tab

## Benefits

### For Students
- ✅ Tailor resumes for different roles
- ✅ Easy management of multiple versions
- ✅ View uploaded resumes anytime
- ✅ Delete outdated versions

### For Admins
- ✅ Better insight into student preparedness
- ✅ View all resume variants in one place
- ✅ Quick access to relevant resume for specific roles

### For Everyone
- ✅ Dark/Light mode toggle always accessible
- ✅ Improved user experience

## Testing

### Test Cases
1. **Upload Resume**: Verify label is required, PDF only
2. **View Resume**: Ensure new tab opens with correct URL
3. **Delete Resume**: Confirm removal and counter update
4. **3 Resume Limit**: Check message appears and upload disabled
5. **Admin View**: Verify all resumes visible in profile dialog
6. **Theme Toggle**: Test light/dark/system mode switching

## Rollback (If Needed)

If you need to rollback:

```sql
-- Remove the new column
ALTER TABLE students DROP COLUMN resumes;
```

Then revert the code changes using git:
```bash
git checkout HEAD~1 -- db/schema.ts app/dashboard/profile/edit/page.tsx app/dashboard/admin/page.tsx components/app-sidebar.tsx
git checkout HEAD -- components/sidebar-footer.tsx  # Delete this file
```

## Support

The old `resumeUrl` field is still supported, so existing resumes will continue to work. The system automatically checks both fields.

