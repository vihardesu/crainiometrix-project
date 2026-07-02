import { Suspense } from "react";
import { getSessionNavigator } from "@/lib/auth/session";
import { MessagesCommandCenter } from "@/components/messaging/messages-command-center";

function MessagesLoading() {
    return (
        <div className="flex h-[calc(100dvh-3rem)] items-center justify-center rounded-xl border border-secondary md:h-[calc(100dvh-4rem)]">
            <p className="text-sm text-tertiary">Loading messages...</p>
        </div>
    );
}

export default async function MessagesPage() {
    const navigator = await getSessionNavigator();

    if (!navigator) {
        return null;
    }

    return (
        <div className="-mx-4 -my-6 md:-mx-8 lg:-mx-10">
            <Suspense fallback={<MessagesLoading />}>
                <MessagesCommandCenter navigatorId={navigator.id} navigatorName={navigator.fullName} />
            </Suspense>
        </div>
    );
}
