import { cookies } from "next/headers";
import { getNavigatorById, isValidNavigatorId, type DemoNavigator } from "@/lib/auth/demo-users";

export const NAVIGATOR_SESSION_COOKIE = "navigator_session";

const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
};

export async function setSessionCookie(navigatorId: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(NAVIGATOR_SESSION_COOKIE, navigatorId, cookieOptions);
}

export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(NAVIGATOR_SESSION_COOKIE);
}

export async function getSessionNavigatorId(): Promise<string | undefined> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(NAVIGATOR_SESSION_COOKIE)?.value;

    if (!sessionId || !isValidNavigatorId(sessionId)) {
        return undefined;
    }

    return sessionId;
}

export async function getSessionNavigator(): Promise<DemoNavigator | undefined> {
    const sessionId = await getSessionNavigatorId();

    if (!sessionId) {
        return undefined;
    }

    return getNavigatorById(sessionId);
}
