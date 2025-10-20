import * as React from "react";

import { SearchForm } from "@/components/search-form";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { SidebarData } from "./sidebar-data";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SidebarFooterContent } from "./sidebar-footer";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  let isAdmin = false;
  if (session?.user?.id) {
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });
    isAdmin = currentUser?.role === "admin";
  }

  const data = {
    versions: ["1.0.0"],
    navMain: isAdmin ? [
      {
        title: "Admin",
        url: "/dashboard/admin",
        items: [
          { title: "Student Management", url: "/dashboard/admin" },
        ],
      },
    ] : [
      {
        title: "Student",
        url: "/dashboard",
        items: [
          { title: "Dashboard", url: "/dashboard" },
          { title: "Profile", url: "/dashboard/profile/edit" },
          { title: "Jobs", url: "/dashboard/jobs" },
        ],
      },
    ],
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 pl-2">
          <Image src="/noteforge-logo.png" alt="Logo" width={32} height={32} />
          <h2>{isAdmin ? "Admin Portal" : "Job Portal"}</h2>
        </Link>

        <React.Suspense>
          <SearchForm />
        </React.Suspense>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <SidebarData data={data} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarFooterContent 
          userName={session?.user?.name} 
          userEmail={session?.user?.email}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
