"use server";

import { redirect } from "next/navigation";
import { findNavigator } from "@/lib/auth/demo-users";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session";

export type LoginState = {
    error?: string;
};

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
    const email = formData.get("email")?.toString().trim() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    if (!email || !password) {
        return { error: "Email and password are required." };
    }

    const navigator = findNavigator(email, password);

    if (!navigator) {
        return { error: "Invalid email or password." };
    }

    await setSessionCookie(navigator.id);
    redirect("/dashboard");
}

export async function logout(): Promise<void> {
    await clearSessionCookie();
    redirect("/login");
}
