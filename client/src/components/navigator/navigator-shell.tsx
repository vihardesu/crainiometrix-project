"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { HomeLine, MessageChatCircle, Settings01 } from "@untitledui/icons";
import type { DemoNavigator } from "@/lib/auth/demo-users";
import { SidebarNavigationSimple } from "@/components/application/app-navigation/sidebar-navigation/sidebar-simple";
import type { NavItemType } from "@/components/application/app-navigation/config";
import { NavigatorAccountCard } from "@/components/navigator/navigator-account-card";

const NAV_ITEMS: NavItemType[] = [
    { label: "Dashboard", href: "/dashboard", icon: HomeLine },
    { label: "Messages", href: "/messages", icon: MessageChatCircle },
    { label: "Admin", href: "/admin", icon: Settings01 },
];

export function NavigatorShell({ navigator, children }: { navigator: DemoNavigator; children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-dvh bg-primary">
            <SidebarNavigationSimple
                activeUrl={pathname}
                items={NAV_ITEMS}
                accountCard={<NavigatorAccountCard navigator={navigator} />}
            />
            <main className="flex min-h-dvh flex-1 flex-col lg:pl-0">
                <div className="flex flex-1 flex-col px-4 py-6 md:px-8 lg:px-10">{children}</div>
            </main>
        </div>
    );
}
