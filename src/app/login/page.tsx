'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { loginAdmin } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, ShieldCheck, Loader2, AlertCircle } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError("")

        const res = await loginAdmin(formData)

        if (res?.error) {
            setError(res.error)
            setLoading(false)
        } else {
            // Success
            router.push("/") // Redirect to Dashboard
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-20"></div>

            <Card className="w-full max-w-md relative z-10 border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <h1 className="font-bold text-3xl text-cyan-500 tracking-tight">OperApp</h1>
                        <div className="relative w-64 h-24">
                            <Image
                                src="/logo-ravelo-transparent.png"
                                alt="Ravelo Construcciones"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight text-white mt-4">
                        Acceso Seguro
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Sistema Integrado de Gestión Operacional
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-200">Usuario / Correo</Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@empresa.com"
                                    required
                                    className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20 transition-all pl-10"
                                />
                                <div className="absolute left-3 top-2.5 text-slate-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-200">Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20 transition-all pl-10"
                                />
                                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium shadow-lg shadow-cyan-900/20 border border-cyan-500/20 mt-4" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Iniciar Sesión
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-xs text-slate-500 border-t border-slate-800 pt-4 bg-slate-900/30 rounded-b-xl">
                    <p>Acceso restringido únicamente a personal autorizado.</p>
                    <p>OperApp v2.0 - Security Layer</p>
                </CardFooter>
            </Card>
        </div>
    )
}
