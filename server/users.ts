"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { students } from "@/db/schema";

export const signInUser = async (email: string, password: string) => {
    try {
        await auth.api.signInEmail({
            body: {
                email,
                password
            },
        });

        return { success: true, message: "Signed in successfully" };
    } catch (error) {
        const e = error as Error;
        return { success: false, message: e.message || "Failed to sign in" };
    }
};

export const signUpUser = async (email: string, password: string, name: string) => {
    try {
        const result = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            },
        });

        // Create student profile automatically after signup
        if (result?.user?.id) {
            await db.insert(students).values({
                userId: result.user.id,
                email: email,
                status: "pending",
            });
        }

        return { success: true, message: "Signed up successfully" };
    } catch (error) {
        const e = error as Error;
        return { success: false, message: e.message || "Failed to sign up" };
    }
};