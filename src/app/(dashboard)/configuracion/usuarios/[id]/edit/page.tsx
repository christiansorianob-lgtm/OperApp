import { updateUsuario, getUsuarioById } from "@/app/actions/usuarios"
import { getClientes } from "@/app/actions/clientes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { BackButton } from "@/components/common/BackButton"
import { notFound } from "next/navigation"

export default async function EditUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data: usuario } = await getUsuarioById(id)
    const { data: clientes } = await getClientes()

    if (!usuario) {
        notFound()
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <BackButton fallback="/configuracion/usuarios" />
                <h1 className="text-2xl font-bold">Editar Usuario</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Datos del Usuario: {usuario.nombre}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={async (formData) => {
                        'use server'
                        await updateUsuario(id, formData)
                    }} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre Completo</Label>
                            <Input id="nombre" name="nombre" defaultValue={usuario.nombre} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email (Acceso)</Label>
                            <Input id="email" name="email" type="email" defaultValue={usuario.email} required />
                        </div>

                        <div className="space-y-2 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                            <Label htmlFor="password">Nueva Contraseña</Label>
                            <Input id="password" name="password" type="password" placeholder="Dejar en blanco para mantener la actual" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="perfil">Perfil</Label>
                                <Select name="perfil" required defaultValue={usuario.perfil}>
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
                                <Label htmlFor="clienteId">Cliente Asociado</Label>
                                <Select name="clienteId" defaultValue={usuario.clienteId || "none"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione cliente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Ninguno --</SelectItem>
                                        {clientes?.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="activo" name="activo" value="true" defaultChecked={usuario.activo} />
                            <Label htmlFor="activo" className="font-medium cursor-pointer">Usuario Activo</Label>
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <Button variant="outline" type="button">Cancelar</Button>
                            <Button type="submit">Guardar Cambios</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
