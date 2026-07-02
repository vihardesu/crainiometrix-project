import { redirect } from "next/navigation";
import { NavigatorShell } from "@/components/navigator/navigator-shell";
import { getSessionNavigator } from "@/lib/auth/session";

export default async function NavigatorLayout({ children }: { children: React.ReactNode }) {
    const navigator = await getSessionNavigator();

    if (!navigator) {
        redirect("/login");
    }

    return <NavigatorShell navigator={navigator}>{children}</NavigatorShell>;
}
