import { getClientSession } from "@/app/actions/auth-client"
import { redirect } from "next/navigation"
import { Building2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { logoutClient } from "@/app/actions/auth-client"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
    const session = await getClientSession()

    if (!session) {
        redirect("/portal/login")
    }

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-primary tracking-tight">Portal de Clientes</h1>
                        <p className="text-xs text-muted-foreground font-medium">OperApp</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">{session.nombre}</p>
                        <p className="text-xs text-muted-foreground">{session.email}</p>
                    </div>
                    <form action={logoutClient}>
                        <Button variant="ghost" size="icon" title="Cerrar Sesión">
                            <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive" />
                        </Button>
                    </form>
                </div>
            </header>

            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
                {children}
            </main>

            <footer className="border-t py-6 text-center text-sm text-muted-foreground bg-white">
                <p>&copy; {new Date().getFullYear()} OperApp - Gestión de Obras Civiles</p>
            </footer>
        </div>
    )
}
