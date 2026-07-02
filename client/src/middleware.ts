import { type NextRequest, NextResponse } from "next/server";
import { isValidNavigatorId } from "@/lib/auth/demo-users";
import { NAVIGATOR_SESSION_COOKIE } from "@/lib/auth/session";

const PROTECTED_PREFIXES = ["/dashboard", "/messages", "/admin"];

function hasValidSession(request: NextRequest): boolean {
    const sessionId = request.cookies.get(NAVIGATOR_SESSION_COOKIE)?.value;
    return Boolean(sessionId && isValidNavigatorId(sessionId));
}

function isProtectedPath(pathname: string): boolean {
    return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isAuthenticated = hasValidSession(request);

    if (pathname === "/") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = isAuthenticated ? "/dashboard" : "/login";
        return NextResponse.redirect(redirectUrl);
    }

    if (pathname === "/login" && isAuthenticated) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/dashboard";
        return NextResponse.redirect(redirectUrl);
    }

    if (isProtectedPath(pathname) && !isAuthenticated) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/login";
        return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
