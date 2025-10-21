import { NextRequest, NextResponse } from "next/server";
import { getAllStudents } from "@/server/admin";
import { db } from "@/db/drizzle";
import { students } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const action = searchParams.get("action");

    // Check admin access
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // If requesting stats
    if (action === "stats") {
      const total = await db.select({ count: count() }).from(students);
      const pending = await db.select({ count: count() }).from(students).where(eq(students.status, "pending"));
      const approved = await db.select({ count: count() }).from(students).where(eq(students.status, "approved"));
      const rejected = await db.select({ count: count() }).from(students).where(eq(students.status, "rejected"));
      const banned = await db.select({ count: count() }).from(students).where(eq(students.status, "banned"));

      return NextResponse.json({
        total: total[0].count,
        pending: pending[0].count,
        approved: approved[0].count,
        rejected: rejected[0].count,
        banned: banned[0].count,
      });
    }

    // Get all students
    const allStudents = await getAllStudents(status === "all" ? undefined : status);
    
    // Return in paginated format (simplified - no actual pagination for now)
    return NextResponse.json({
      items: allStudents,
      nextCursor: null,
      hasMore: false,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch students" },
      { status: error.message === "Unauthorized" || error.message === "Admin access required" ? 403 : 500 }
    );
  }
}

