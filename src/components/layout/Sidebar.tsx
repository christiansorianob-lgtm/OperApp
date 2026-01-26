'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Tractor, Package, Settings, FileText as Copy, Building2, LogOut, UserCog, ChevronUp } from 'lucide-react'
import clsx from 'clsx'
import Image from 'next/image'
import { useState } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { logoutAdmin } from "@/app/actions/auth"
import { ProfileEditDialog } from "@/components/forms/ProfileEditDialog"

const tools = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes & Proyectos', href: '/clientes', icon: Building2 },
    { name: 'Maquinaria', href: '/maquinaria', icon: Tractor },
    { name: 'Almacén', href: '/almacen', icon: Package },
    { name: 'Reportes', href: '/reportes', icon: Copy },
    { name: 'Configuración', href: '/configuracion', icon: Settings },
]

export function Sidebar({ className, user }: { className?: string, user?: any }) {
    const pathname = usePathname()
    const [showProfile, setShowProfile] = useState(false)

    // Get initials and name
    const userName = user?.nombre || "Usuario"
    const userRole = user?.role || "Invitado"
    const initials = userName.charAt(0).toUpperCase()

    return (
        <>
            <aside className={clsx("w-64 bg-card border-r border-border flex flex-col h-screen fixed left-0 top-0 bottom-0 z-40 transition-transform duration-300 md:translate-x-0", className)}>
                <div className="flex flex-col items-center justify-center p-4 border-b border-border gap-2">
                    <h1 className="font-bold text-xl text-primary tracking-tight">OperApp</h1>
                    <div className="relative w-60 h-24">
                        <Image
                            src="/logo-ravelo-transparent.png"
                            alt="Ravelo Construcciones"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-3">
                        {tools.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/' && (pathname?.startsWith(item.href) ?? false))
                            const Icon = item.icon

                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={clsx(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.name}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-border">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 rounded-lg cursor-pointer transition-colors" suppressHydrationWarning>
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
                                    {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">{userName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{userRole}</p>
                                </div>
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="start" className="w-56">
                            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setShowProfile(true)}>
                                <UserCog className="mr-2 h-4 w-4" />
                                <span>Editar Perfil</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => logoutAdmin()}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Cerrar Sesión</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {user && (
                <ProfileEditDialog
                    open={showProfile}
                    onOpenChange={setShowProfile}
                    user={user}
                />
            )}
        </>
    )
}
