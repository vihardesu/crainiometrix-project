"use client";

import type { DemoNavigator } from "@/lib/auth/demo-users";
import { logout } from "@/lib/auth/actions";
import { NavAccountCard, type NavAccountType } from "@/components/application/app-navigation/base-components/nav-account-card";

function toNavAccount(navigator: DemoNavigator): NavAccountType {
    return {
        id: navigator.id,
        name: navigator.fullName,
        email: navigator.email,
        avatar: "",
        status: "online",
    };
}

export function NavigatorAccountCard({ navigator }: { navigator: DemoNavigator }) {
    const account = toNavAccount(navigator);

    return (
        <NavAccountCard
            demoMode
            items={[account]}
            selectedAccountId={navigator.id}
            avatarRounded
            onSignOut={() => void logout()}
        />
    );
}
