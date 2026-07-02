export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <div className="flex min-h-dvh items-center justify-center bg-primary px-4 py-12">{children}</div>;
}
