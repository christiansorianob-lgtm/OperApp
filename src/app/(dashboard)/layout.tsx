import { AppLayout } from "@/components/layout/AppLayout";
import { getAdminSession } from "@/app/actions/auth";

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getAdminSession()
    console.log("DashboardLayout Session:", session)

    return (
        <AppLayout session={session}>
            {children}
        </AppLayout>
    );
}
