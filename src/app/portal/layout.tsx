import { getAdminSession, logoutAdmin } from "@/app/actions/auth"
import { redirect } from "next/navigation"
import { Building2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
    const session = await getAdminSession()

    if (!session || session.role !== 'CLIENTE') {
        redirect("/login")
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
            <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                        <Building2 className="w-6 h-6 text-cyan-500" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-slate-100 tracking-tight">Portal de Clientes</h1>
                        <p className="text-xs text-slate-400 font-medium">OperApp</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-slate-200">{session.nombre}</p>
                        <p className="text-xs text-slate-500">{session.email}</p>
                    </div>
                    <form action={logoutAdmin}>
                        <Button variant="ghost" size="icon" title="Cerrar Sesión" className="hover:bg-slate-800 hover:text-red-400">
                            <LogOut className="w-5 h-5 text-slate-400" />
                        </Button>
                    </form>
                </div>
            </header>

            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
                {children}
            </main>

            <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500 bg-slate-950">
                <p>&copy; {new Date().getFullYear()} OperApp - Gestión de Obras Civiles</p>
            </footer>
        </div>
    )
}
