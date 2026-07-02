import { getSessionNavigator } from "@/lib/auth/session";

export default async function DashboardPage() {
    const navigator = await getSessionNavigator();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-display-sm font-semibold text-primary">Dashboard</h1>
                <p className="mt-1 text-md text-tertiary">Welcome back, {navigator?.fullName ?? "Navigator"}.</p>
            </div>

            <div className="rounded-xl border border-secondary bg-secondary_subtle p-8">
                <h2 className="text-lg font-semibold text-primary">Messages & AI Triage</h2>
                <p className="mt-2 max-w-prose text-md text-tertiary">
                    Use the Messages sidebar to manage conversations. Toggle AI mode on the messages page to let the agent
                    triage unread messages automatically.
                </p>
            </div>
        </div>
    );
}
