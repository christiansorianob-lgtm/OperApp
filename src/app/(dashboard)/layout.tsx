import { AppLayout } from "@/components/layout/AppLayout";
import { getAdminSession } from "@/app/actions/auth";

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getAdminSession()

    // Security Redirect: Clients should NOT see the dashboard
    if (session && session.role === 'CLIENTE') {
        const { redirect } = await import("next/navigation")
        redirect("/portal")
    }

    return (
        <AppLayout session={session}>
            {children}
        </AppLayout>
    );
}
