import PasswordResetEmail from "@/components/emails/reset-email";
import VerificationEmail from "@/components/emails/verification-email";
import { db } from "@/db/drizzle";
import { schema, students } from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { Resend } from "resend";
import { eq } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            await resend.emails.send({
                from: 'NoteForge <noteforge@orcdev.com>',
                to: [user.email],
                subject: 'Verify your email address',
                react: VerificationEmail({ userName: user.name, verificationUrl: url }),
            });
        },
        sendOnSignUp: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            await resend.emails.send({
                from: 'NoteForge <noteforge@orcdev.com>',
                to: [user.email],
                subject: 'Reset your password',
                react: PasswordResetEmail({ userName: user.name, resetUrl: url, requestTime: new Date().toLocaleString() }),
            });
        },
    },
    database: drizzleAdapter(db, {
        provider: "pg",
        schema
    }),
    plugins: [nextCookies()],
    async onAfterSignUp(user) {
        // Automatically create student profile for all signups (email/password and OAuth)
        try {
            // Check if student profile already exists
            const existingProfile = await db.query.students.findFirst({
                where: eq(students.userId, user.id),
            });

            // Only create if doesn't exist
            if (!existingProfile) {
                await db.insert(students).values({
                    userId: user.id,
                    email: user.email,
                    status: "pending",
                });
            }
        } catch (error) {
            console.error("Error creating student profile:", error);
            // Don't throw - let signup complete even if profile creation fails
        }
    },
});