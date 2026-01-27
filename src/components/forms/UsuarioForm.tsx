'use client'

import { useState } from "react"
import { createUsuario, updateUsuario } from "@/app/actions/usuarios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface UsuarioFormProps {
    clientes: { id: string, nombre: string }[]
    usuario?: {
        id: string
        nombre: string
        email: string
        perfil: string
        clienteId?: string | null
        activo: boolean
    }
}

export function UsuarioForm({ clientes, usuario }: UsuarioFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [perfil, setPerfil] = useState(usuario?.perfil || "ADMINISTRADOR")
    const [clienteId, setClienteId] = useState(usuario?.clienteId || "none")

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)

        // Manual Validation for Client Profile
        const currentPerfil = formData.get("perfil") as string
        const currentClienteId = formData.get("clienteId") as string

        if (currentPerfil === "CLIENTE" && (!currentClienteId || currentClienteId === "none")) {
            alert("Error: Para el perfil CLIENTE es OBLIGATORIO seleccionar un Cliente Asociado.")
            setIsSubmitting(false)
            return
        }

        let result
        if (usuario) {
            result = await updateUsuario(usuario.id, formData)
        } else {
            result = await createUsuario(formData)
        }

        if (result?.error) {
            alert(result.error)
            setIsSubmitting(false)
        }
        // If success, the server action redirects, so we don't need to do anything else here.
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{usuario ? `Datos del Usuario: ${usuario.nombre}` : "Datos del Usuario"}</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre Completo</Label>
                        <Input
                            id="nombre"
                            name="nombre"
                            defaultValue={usuario?.nombre}
                            placeholder="Ej. Juan Perez"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email (Acceso)</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={usuario?.email}
                            placeholder="juan@empresa.com"
                            required
                        />
                    </div>

                    <div className={`space-y-2 ${usuario ? 'bg-yellow-50 p-3 rounded-md border border-yellow-200' : ''}`}>
                        <Label htmlFor="password">{usuario ? 'Nueva Contraseña' : 'Contraseña'}</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder={usuario ? "Dejar en blanco para mantener la actual" : "******"}
                            required={!usuario}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="perfil">Perfil</Label>
                            <Select
                                name="perfil"
                                required
                                value={perfil}
                                onValueChange={setPerfil}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione perfil" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                                    <SelectItem value="CLIENTE">Cliente (Solo Lectura)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="clienteId">
                                Cliente Asociado
                                {perfil === "CLIENTE" ? <span className="text-red-500 ml-1">*</span> : " (Opcional)"}
                            </Label>
                            <Select
                                name="clienteId"
                                value={clienteId}
                                onValueChange={setClienteId}
                            >
                                <SelectTrigger className={perfil === "CLIENTE" && (!clienteId || clienteId === "none") ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Seleccione cliente..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Ninguno --</SelectItem>
                                    {clientes?.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {perfil === "CLIENTE" && (
                                <p className="text-xs text-blue-600 font-medium">
                                    Requerido para filtrar tareas.
                                </p>
                            )}
                        </div>
                    </div>

                    {usuario && (
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="activo" name="activo" value="true" defaultChecked={usuario.activo} />
                            <Label htmlFor="activo" className="font-medium cursor-pointer">Usuario Activo</Label>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-2">
                        <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {usuario ? 'Guardar Cambios' : 'Crear Usuario'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
