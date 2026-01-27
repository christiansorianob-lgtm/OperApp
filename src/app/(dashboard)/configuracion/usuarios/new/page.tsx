import { createUsuario } from "@/app/actions/usuarios"
import { getClientes } from "@/app/actions/clientes" // Assume this exists for dropdown
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BackButton } from "@/components/common/BackButton"

export default async function NewUsuarioPage() {
    const { data: clientes } = await getClientes()

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <BackButton fallback="/configuracion/usuarios" />
                <h1 className="text-2xl font-bold">Nuevo Usuario</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Datos del Usuario</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={createUsuario} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre Completo</Label>
                            <Input id="nombre" name="nombre" placeholder="Ej. Juan Admin" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email (Acceso)</Label>
                            <Input id="email" name="email" type="email" placeholder="juan@email.com" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="perfil">Perfil</Label>
                                <Select name="perfil" required defaultValue="ADMINISTRADOR">
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
                                <Label htmlFor="clienteId">Cliente Asociado (Opcional)</Label>
                                <Select name="clienteId">
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
                                <p className="text-xs text-muted-foreground">Solo requerido si el perfil es CLIENTE.</p>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <Button variant="outline" type="button">Cancelar</Button>
                            <Button type="submit">Crear Usuario</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
