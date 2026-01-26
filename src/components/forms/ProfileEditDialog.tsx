'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { updateProfile } from "@/app/actions/auth"

interface ProfileEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: any
}

export function ProfileEditDialog({ open, onOpenChange, user }: ProfileEditDialogProps) {
    const [loading, setLoading] = useState(false)
    const [celular, setCelular] = useState(user?.celular || "")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData()
        formData.append("id", user.id)
        formData.append("celular", celular)
        formData.append("password", password)

        const res = await updateProfile(formData)

        if (res.error) {
            setError(res.error)
        } else {
            onOpenChange(false)
            setPassword("") // Clear password
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                    <DialogDescription>
                        Actualiza tu información personal y contraseña.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {error && <div className="text-red-500 text-sm">{error}</div>}

                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" value={user?.nombre || ''} disabled className="bg-muted" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Correo</Label>
                        <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="celular">Celular / Teléfono</Label>
                        <Input
                            id="celular"
                            value={celular}
                            onChange={e => setCelular(e.target.value)}
                            placeholder="Ingrese su número..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Nueva Contraseña (Opcional)</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Dejar en blanco para mantener actual"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
