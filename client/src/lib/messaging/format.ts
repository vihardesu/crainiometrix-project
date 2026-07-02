export function formatMessageTime(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatListTime(iso: string | null): string {
    if (!iso) {
        return "";
    }

    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
        return "Just now";
    }

    if (diffMins < 60) {
        return `${diffMins}m`;
    }

    const diffHours = Math.floor(diffMins / 60);

    if (diffHours < 24) {
        return `${diffHours}h`;
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function roleLabel(role: string): string {
    return role.charAt(0).toUpperCase() + role.slice(1);
}
