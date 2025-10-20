import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { user, students } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function middleware(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Get user details
    const currentUser = await db.query.user.findFirst({
        where: eq(user.id, session.user.id),
    });

    if (!currentUser) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const pathname = request.nextUrl.pathname;

    // Admin access
    if (currentUser.role === "admin") {
        // Admin can access /dashboard/admin
        if (pathname.startsWith("/dashboard/admin")) {
            return NextResponse.next();
        }
        // Redirect admin from ANY other dashboard route to admin dashboard
        // Admins should ONLY access /dashboard/admin
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    }

    // Student access
    // Block students from accessing admin routes
    if (pathname.startsWith("/dashboard/admin")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Get student profile
    let studentProfile = await db.query.students.findFirst({
        where: eq(students.userId, session.user.id),
    });

    // Auto-create profile if it doesn't exist (for OAuth signups or migrations)
    if (!studentProfile) {
        const [newProfile] = await db.insert(students).values({
            userId: session.user.id,
            email: currentUser.email,
            status: "pending",
        }).returning();
        studentProfile = newProfile;
    }

    // Handle different student statuses
    if (studentProfile.status === "banned") {
        // Banned students can only see pending page
        if (!pathname.startsWith("/dashboard/pending")) {
            return NextResponse.redirect(new URL("/dashboard/pending", request.url));
        }
        return NextResponse.next();
    }

    if (studentProfile.status === "rejected" || studentProfile.status === "pending") {
        // Pending/rejected students can access pending page and profile edit
        if (pathname.startsWith("/dashboard/pending") || pathname.startsWith("/dashboard/profile/edit")) {
            return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/dashboard/pending", request.url));
    }

    // Approved students
    if (studentProfile.status === "approved") {
        // Don't let approved students access pending page
        if (pathname.startsWith("/dashboard/pending")) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};