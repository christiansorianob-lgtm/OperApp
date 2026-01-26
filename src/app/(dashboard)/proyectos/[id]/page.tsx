import Link from "next/link"
import { notFound } from "next/navigation"
import { getProyectoById } from "@/app/actions/proyectos"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, ClipboardList, Plus, Building2, Pencil } from "lucide-react"

import { GoBackButton } from "@/components/ui/GoBackButton"

export default async function ProyectoDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const res = await getProyectoById(id)

    if (res.error || !res.data) {
        notFound()
    }

    const proyecto = res.data
    const cliente = proyecto.cliente



    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <GoBackButton fallbackRoute={`/clientes/${cliente.id}`} />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
                            {proyecto.nombre}
                            <Badge variant={proyecto.estado === 'EN_EJECUCION' ? 'default' : 'secondary'}>
                                {proyecto.estado}
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            {proyecto.codigo} • <Building2 className="w-3 h-3" /> {cliente.nombre}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/proyectos/${proyecto.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </Link>
                    </Button>

                    <Button variant="outline" asChild>
                        <Link href={`/tareas?proyectoId=${proyecto.id}`}>
                            <ClipboardList className="mr-2 h-4 w-4" />
                            Ver Tareas
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/tareas/new?clienteId=${cliente.id}&proyectoId=${proyecto.id}`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Tarea
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información del Proyecto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Building2 className="w-4 h-4" /> Cliente
                                </span>
                                <span className="font-medium">
                                    <Link href={`/clientes/${cliente.id}`} className="hover:underline text-primary">
                                        {cliente.nombre}
                                    </Link>
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Inicio
                                </span>
                                <span className="font-medium">
                                    {proyecto.createdAt ? new Date(proyecto.createdAt).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                            {proyecto.observaciones && (
                                <div className="pt-2">
                                    <span className="text-muted-foreground block mb-1 text-sm">Observaciones:</span>
                                    <p className="text-sm bg-muted p-2 rounded">{proyecto.observaciones}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* No Map for Proyecto anymore */}
            </div>
        </div>
    )
}
