'use client'

import { useState } from "react"
import Image from "next/image"
import { loginClient } from "@/app/actions/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"

export default function ClientLoginPage() {
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError("")

        const res = await loginClient(formData)

        if (res?.error) {
            setError(res.error)
            setIsLoading(false)
        } else {
            // Redirect happens server side or manual here? 
            // Server action didn't redirect on success (it returned success: true), so we interpret it here to avoid error.
            // Actually usually cleaner if server redirects OR client redirects. 
            // Let's do client redirect to update UI state cleanly.
            window.location.href = "/portal"
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
                <CardHeader className="space-y-2 text-center">
                    <div className="flex flex-col items-center justify-center mb-2">
                        <div className="relative w-48 h-20 mb-2">
                            <Image
                                src="/logo-ravelo-transparent.png"
                                alt="Ravelo Construcciones"
                                fill
                                className="object-contain" // priority={true} // Priority if needed
                            />
                        </div>
                        <h1 className="text-3xl font-bold text-primary tracking-tight">OperApp</h1>
                        <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Mobile</span>
                    </div>
                    <CardTitle className="sr-only">Portal de Acceso</CardTitle>
                    <CardDescription>
                        Ingrese sus credenciales para acceder.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="cliente@empresa.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Ingresar
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center text-xs text-muted-foreground">
                    &copy; OperApp - Ravelo Construcciones
                </CardFooter>
            </Card>
        </div>
    )
}
