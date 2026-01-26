import Link from "next/link"
import { notFound } from "next/navigation"
import { getClienteById } from "@/services/clientes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, Plus, ClipboardList, Leaf } from "lucide-react"

import { GoBackButton } from "@/components/ui/GoBackButton"

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const cliente = await getClienteById(id)

    if (!cliente) {
        notFound()
    }

    // Determine Map Center (if any projects have location)
    // Default center (Bogota)
    let mapLat = 4.6097
    let mapLng = -74.0817

    // Cast to any because TS might not know projects relations yet if types aren't regenerated fully or valid in IDE but runtime matches Prisma.
    // However, schema has `proyectos` relation.

    // const projectsWithLoc = cliente.proyectos?.filter((p: any) => p.latitud && p.longitud) || []
    // if (projectsWithLoc.length > 0) {
    //      mapLat = projectsWithLoc[0].latitud
    //      mapLng = projectsWithLoc[0].longitud
    // }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <GoBackButton fallbackRoute="/clientes" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
                            {cliente.nombre}
                            <Badge variant={cliente.estado === 'ACTIVO' ? 'default' : 'destructive'}>
                                {cliente.estado}
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            {cliente.codigo} • {cliente.direccion}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/tareas?clienteId=${cliente.id}`}>
                            <ClipboardList className="mr-2 h-4 w-4" />
                            Ver Tareas
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/proyectos/new?clienteId=${cliente.id}`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Proyecto
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    Código
                                </span>
                                <span className="font-mono font-bold">{cliente.codigo}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <User className="w-4 h-4" /> Responsable
                                </span>
                                <span className="font-medium">{cliente.responsable}</span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Registrado
                                </span>
                                <span className="font-medium">{cliente.createdAt.toLocaleDateString()}</span>
                            </div>
                            {cliente.observaciones && (
                                <div className="pt-2">
                                    <span className="text-muted-foreground block mb-1">Observaciones:</span>
                                    <p className="text-sm bg-muted p-2 rounded">{cliente.observaciones}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>


            </div>

            {/* Proyectos Section */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Proyectos ({cliente.proyectos?.length || 0})</h2>
                </div>

                {cliente.proyectos && cliente.proyectos.length > 0 ? (
                    <Card>
                        <div className="rounded-md border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="p-4 font-medium">Código</th>
                                        <th className="p-4 font-medium">Nombre</th>
                                        <th className="p-4 font-medium">Área (Ha)</th>
                                        <th className="p-4 font-medium">Estado</th>
                                        <th className="p-4 font-medium text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {cliente.proyectos.map((proyecto: any) => (
                                        <tr key={proyecto.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-4 font-medium">{proyecto.codigo}</td>
                                            <td className="p-4">{proyecto.nombre}</td>
                                            <td className="p-4">{proyecto.areaHa || '-'}</td>
                                            <td className="p-4">
                                                <Badge variant={proyecto.estado === 'EN_EJECUCION' ? 'default' : 'secondary'}>
                                                    {proyecto.estado}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/proyectos/${proyecto.id}`}>
                                                        Administrar
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground space-y-4">
                            <div className="p-4 bg-muted rounded-full">
                                <Leaf className="w-8 h-8 opacity-50" />
                            </div>
                            <div>
                                <h3 className="tex-lg font-medium">No hay proyectos registrados</h3>
                                <p className="text-sm">Comienza agregando proyectos a este cliente.</p>
                            </div>
                            <Button variant="outline" asChild>
                                <Link href={`/proyectos/new?clienteId=${cliente.id}`}>
                                    Registrar Primer Proyecto
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
