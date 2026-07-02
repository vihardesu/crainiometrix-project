import { redirect } from "next/navigation";
import { getSessionNavigatorId } from "@/lib/auth/session";

export default async function HomePage() {
    const sessionId = await getSessionNavigatorId();
    redirect(sessionId ? "/dashboard" : "/login");
}
