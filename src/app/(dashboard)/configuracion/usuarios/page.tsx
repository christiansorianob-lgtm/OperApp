import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { getUsuarios, deleteUsuario } from "@/app/actions/usuarios"
import { BackButton } from "@/components/common/BackButton"

export default async function UsuariosPage() {
    const { data: usuarios, error } = await getUsuarios()

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <BackButton fallback="/configuracion" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary">Usuarios del Sistema</h1>
                        <p className="text-muted-foreground">Gestión de acceso al portal web.</p>
                    </div>
                </div>
                <Button asChild>
                    <Link href="/configuracion/usuarios/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Usuario
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Usuarios</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Perfil</TableHead>
                                <TableHead>Cliente Asociado</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usuarios?.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.nombre}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.perfil === 'ADMINISTRADOR' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {user.perfil}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {user.cliente ? user.cliente.nombre : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {user.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/configuracion/usuarios/${user.id}/edit`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            {/* Delete Form */}
                                            <form action={async () => {
                                                'use server'
                                                await deleteUsuario(user.id)
                                            }}>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!usuarios || usuarios.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No hay usuarios registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
