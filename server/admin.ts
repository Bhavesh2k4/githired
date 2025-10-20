"use server";

import { db } from "@/db/drizzle";
import { students, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, desc, sql } from "drizzle-orm";

// Verify admin access
async function verifyAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (currentUser?.role !== "admin") {
    throw new Error("Admin access required");
  }

  return session;
}

// List students with cursor-based pagination
export async function listStudents(params: {
  cursor?: string; // student ID for cursor
  limit?: number;
  status?: "pending" | "approved" | "rejected" | "banned" | "all";
}) {
  await verifyAdmin();

  const limit = params.limit || 20;
  const status = params.status || "all";

  // Build conditions
  let conditions: any[] = [];
  
  if (status !== "all") {
    conditions.push(eq(students.status, status));
  }

  if (params.cursor) {
    const cursorStudent = await db.query.students.findFirst({
      where: eq(students.id, params.cursor),
    });

    if (cursorStudent) {
      conditions.push(
        sql`(${students.createdAt}, ${students.id}) < (${cursorStudent.createdAt}, ${cursorStudent.id})`
      );
    }
  }

  // Use query builder with join to get user name
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const results = await db.query.students.findMany({
    where: whereClause,
    with: {
      user: {
        columns: {
          name: true,
        },
      },
    },
    orderBy: [desc(students.createdAt), desc(students.id)],
    limit: limit + 1,
  });

  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

// Approve student (auto-verifies SRN if present)
export async function approveStudent(studentId: string) {
  await verifyAdmin();

  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  if (!student) {
    throw new Error("Student not found");
  }

  const updateData: any = {
    status: "approved",
    adminNote: null,
    updatedAt: new Date(),
  };

  // Update analytics
  const analytics = student.analytics as any || {};
  analytics.profileApprovedAt = new Date().toISOString();
  updateData.analytics = analytics;

  // Auto-verify SRN when approving (if SRN exists)
  if (student.srn) {
    updateData.srnValid = true;
  }

  const [updated] = await db.update(students)
    .set(updateData)
    .where(eq(students.id, studentId))
    .returning();

  // TODO: Send notification email to student
  // You can use the existing Resend setup from lib/auth.ts

  return updated;
}

// Reject student
export async function rejectStudent(studentId: string, reason: string) {
  await verifyAdmin();

  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  if (!student) {
    throw new Error("Student not found");
  }

  const [updated] = await db.update(students)
    .set({
      status: "rejected",
      adminNote: reason,
      updatedAt: new Date(),
    })
    .where(eq(students.id, studentId))
    .returning();

  // TODO: Send notification email with reason

  return updated;
}

// Ban student
export async function banStudent(studentId: string, reason: string) {
  await verifyAdmin();

  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  if (!student) {
    throw new Error("Student not found");
  }

  const [updated] = await db.update(students)
    .set({
      status: "banned",
      adminNote: reason,
      updatedAt: new Date(),
    })
    .where(eq(students.id, studentId))
    .returning();

  // TODO: Send notification email

  return updated;
}

// Unban student
export async function unbanStudent(studentId: string) {
  await verifyAdmin();

  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  if (!student) {
    throw new Error("Student not found");
  }

  if (student.status !== "banned") {
    throw new Error("Student is not banned");
  }

  const [updated] = await db.update(students)
    .set({
      status: "pending", // Return to pending for re-review
      adminNote: null,
      updatedAt: new Date(),
    })
    .where(eq(students.id, studentId))
    .returning();

  return updated;
}

// Unreject student (move from rejected back to pending)
export async function unrejectStudent(studentId: string) {
  await verifyAdmin();

  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  if (!student) {
    throw new Error("Student not found");
  }

  if (student.status !== "rejected") {
    throw new Error("Student is not rejected");
  }

  const [updated] = await db.update(students)
    .set({
      status: "pending", // Return to pending for re-review
      adminNote: null,
      updatedAt: new Date(),
    })
    .where(eq(students.id, studentId))
    .returning();

  return updated;
}

// Manually verify SRN
export async function verifySRN(studentId: string, valid: boolean) {
  await verifyAdmin();

  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  if (!student) {
    throw new Error("Student not found");
  }

  if (!student.srn) {
    throw new Error("Student has no SRN to verify");
  }

  const [updated] = await db.update(students)
    .set({
      srnValid: valid,
      updatedAt: new Date(),
    })
    .where(eq(students.id, studentId))
    .returning();

  return updated;
}

// Get statistics for admin dashboard
export async function getAdminStats() {
  await verifyAdmin();

  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    pending: sql<number>`count(*) filter (where ${students.status} = 'pending')`,
    approved: sql<number>`count(*) filter (where ${students.status} = 'approved')`,
    rejected: sql<number>`count(*) filter (where ${students.status} = 'rejected')`,
    banned: sql<number>`count(*) filter (where ${students.status} = 'banned')`,
  }).from(students);

  return stats;
}

