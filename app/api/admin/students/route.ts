import { NextRequest, NextResponse } from "next/server";
import { listStudents, getAdminStats } from "@/server/admin";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = (searchParams.get("status") || "all") as any;
    const action = searchParams.get("action");

    // If requesting stats
    if (action === "stats") {
      const stats = await getAdminStats();
      return NextResponse.json(stats);
    }

    // Otherwise list students
    const result = await listStudents({ cursor, limit, status });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch students" },
      { status: error.message === "Unauthorized" || error.message === "Admin access required" ? 403 : 500 }
    );
  }
}

