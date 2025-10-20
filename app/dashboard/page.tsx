import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getStudentProfile, isAdmin } from "@/server/students";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, FileText, CheckCircle, AlertCircle, Edit, BarChart3 } from "lucide-react";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  // Check if user is admin
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (currentUser?.role === "admin") {
    redirect("/dashboard/admin");
  }

  // Get student profile
  const profile = await getStudentProfile();

  if (!profile) {
    redirect("/dashboard/profile/setup");
  }

  // If not approved, redirect to pending page
  if (profile.status !== "approved") {
    redirect("/dashboard/pending");
  }

  const analytics = profile.analytics as any || { profileViews: 0, applications: 0 };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {session.user.name}!</h1>
        <p className="text-muted-foreground">Here's your student portal overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.profileViews || 0}</div>
            <p className="text-xs text-muted-foreground">
              Companies viewing your profile
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.applications || 0}</div>
            <p className="text-xs text-muted-foreground">
              Job applications submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Approved</div>
            <p className="text-xs text-muted-foreground">
              Your profile is live
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Completion</CardTitle>
          <CardDescription>Complete your profile to increase visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Profile Progress</span>
              <span className="font-medium">
                {Math.round(calculateProfileCompletion(profile))}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${calculateProfileCompletion(profile)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
            <div className="flex items-center gap-2">
              {profile.srn ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-sm">SRN Added</span>
            </div>
            <div className="flex items-center gap-2">
              {(profile.resumes && (profile.resumes as any[]).length > 0) || profile.resumeUrl ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-sm">Resume Uploaded</span>
            </div>
            <div className="flex items-center gap-2">
              {profile.skills && profile.skills.length > 0 ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-sm">Skills Added</span>
            </div>
            <div className="flex items-center gap-2">
              {profile.githubUrl || profile.linkedinUrl ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-sm">Social Links</span>
            </div>
          </div>

          <Button asChild className="w-full mt-4">
            <Link href="/dashboard/profile/edit">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button asChild variant="outline" className="h-auto py-6">
            <Link href="/dashboard/profile/edit" className="flex flex-col items-center gap-2">
              <User className="w-6 h-6" />
              <div className="text-center">
                <div className="font-semibold">Update Profile</div>
                <div className="text-xs text-muted-foreground">Edit your information</div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto py-6">
            <Link href="/dashboard/jobs" className="flex flex-col items-center gap-2">
              <FileText className="w-6 h-6" />
              <div className="text-center">
                <div className="font-semibold">Browse Jobs</div>
                <div className="text-xs text-muted-foreground">Find opportunities</div>
              </div>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Placement Status */}
      {(profile.placedIntern || profile.placedFte) && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400">
              🎉 Congratulations on Your Placement!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.placedIntern && (
              <p className="text-sm">✓ Placed for Internship</p>
            )}
            {profile.placedFte && (
              <p className="text-sm">✓ Placed for Full-Time Employment</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function calculateProfileCompletion(profile: any): number {
  let completed = 0;
  let total = 10;

  if (profile.srn) completed++;
  if (profile.phone) completed++;
  if (profile.headline) completed++;
  if (profile.bio) completed++;
  if ((profile.resumes && (profile.resumes as any[]).length > 0) || profile.resumeUrl) completed++;
  if (profile.skills && profile.skills.length > 0) completed++;
  if (profile.githubUrl) completed++;
  if (profile.linkedinUrl) completed++;
  if (profile.location) completed++;
  if (profile.aboutMe) completed++;

  return (completed / total) * 100;
}
