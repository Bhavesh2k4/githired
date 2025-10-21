import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCompanyProfile } from "@/server/companies";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus } from "lucide-react";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function CompanyJobsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  // Fetch fresh user role from database (session might be stale)
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!currentUser || currentUser.role !== "company") {
    redirect("/login");
  }

  const profile = await getCompanyProfile();

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="w-8 h-8" />
            Job Postings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your company's job postings
          </p>
        </div>
        <Button disabled className="opacity-50 cursor-not-allowed">
          <Plus className="w-4 h-4 mr-2" />
          Post a Job
        </Button>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-dashed">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Job Postings Coming Soon</CardTitle>
          <CardDescription className="text-base">
            This feature is currently under development
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            You'll soon be able to:
          </p>
          <ul className="text-left max-w-md mx-auto space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Create and publish job postings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Manage applications from students</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Track applicant status and progress</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Search and filter qualified candidates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Schedule interviews directly from the platform</span>
            </li>
          </ul>
          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              Stay tuned for updates!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Company Info Reminder */}
      {!profile.verified && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-400 text-lg">
              📝 Complete Your Profile
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-500">
              Make sure your company profile is complete and verified before posting jobs. 
              This helps attract the best candidates!
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

