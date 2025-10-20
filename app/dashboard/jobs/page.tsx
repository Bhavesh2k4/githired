import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getStudentProfile } from "@/server/students";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default async function JobsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const profile = await getStudentProfile();

  if (!profile || profile.status !== "approved") {
    redirect("/dashboard/pending");
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Job Opportunities</h1>
        <p className="text-muted-foreground">Browse and apply for available positions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>Job listings will be available here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section is under development. You'll be able to browse and apply for jobs once companies start posting opportunities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

