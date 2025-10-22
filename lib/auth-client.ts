import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    fetchOptions: {
        credentials: "include", // Important for session cookies
    },
})

export const { signIn, signUp, signOut, useSession } = authClient