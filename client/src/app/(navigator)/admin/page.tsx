import { getSessionNavigator } from "@/lib/auth/session";
import { AdminMessagingClient } from "@/components/messaging/admin-messaging-client";

export default async function AdminPage() {
    const navigator = await getSessionNavigator();

    if (!navigator) {
        return null;
    }

    return (
        <div className="-mx-4 -my-6 md:-mx-8 lg:-mx-10">
            <AdminMessagingClient navigatorId={navigator.id} />
        </div>
    );
}
