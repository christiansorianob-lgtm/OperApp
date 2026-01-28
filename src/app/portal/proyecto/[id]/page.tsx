import { getAdminSession } from "@/app/actions/auth"
import Link from "next/link"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, CheckCircle, Clock } from "lucide-react"

export const dynamic = 'force-dynamic'

interface Props {
    params: Promise<{ id: string }>
}

export default async function ProjectDetailPage(props: Props) {
    const params = await props.params;
    const session = await getAdminSession()

    if (!session || session.role !== 'CLIENTE') {
        redirect("/login")
    }

    if (!session.clienteId) {
        return (
            <div className="p-10 text-center text-red-500">
                Error de permisos: Su usuario no tiene un Cliente asociado.
            </div>
        )
    }

    const project = await db.proyecto.findUnique({
        where: { id: params.id },
        include: {
            tareas: {
                orderBy: { fechaProgramada: 'desc' },
                include: {
                    trazabilidad: { take: 1, orderBy: { timestamp: 'desc' } }
                }
            }
        }
    })

    // Security Check: Ensure project belongs to this client
    if (!project || project.clienteId !== session.clienteId) {
        return notFound()
    }

    // Stats
    const completedTasks = project.tareas.filter(t => t.estado === 'EJECUTADA').length
    const totalTasks = project.tareas.length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{project.nombre}</h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        {(project.municipio || project.departamento) && (
                            <>
                                <span>{[project.municipio, project.departamento].filter(Boolean).join(", ")}</span>
                                <span className="text-slate-500">•</span>
                            </>
                        )}
                        <Badge variant="outline">{project.estado}</Badge>
                    </p>
                </div>
                <div className="flex gap-4 text-center">
                    <div className="bg-white p-3 rounded-lg border shadow-sm">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Progreso</p>
                        <p className="text-2xl font-bold text-primary">{progress}%</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Details */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información del Proyecto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Descripción</h4>
                                <p className="text-sm">{project.descripcion || "Sin descripción disponible."}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Ubicación</h4>
                                <div className="text-sm space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Departamento:</span>
                                        {project.departamento || "N/A"}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Municipio:</span>
                                        {project.municipio || "N/A"}
                                    </div>
                                    {project.direccion && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Dirección:</span>
                                            {project.direccion}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Fecha Inicio</h4>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    {project.fechaInicio ? new Date(project.fechaInicio).toLocaleDateString('es-ES', { dateStyle: 'long' }) : "No definida"}
                                </div>
                            </div>

                            {project.observaciones && (
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Observaciones</h4>
                                    <p className="text-sm italic text-muted-foreground bg-muted p-2 rounded-md">
                                        {project.observaciones}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tasks List */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-semibold text-lg text-slate-800">Cronograma de Actividades</h3>
                    <div className="grid gap-4">
                        {project.tareas.length === 0 ? (
                            <Card>
                                <CardContent className="py-10 text-center text-muted-foreground">
                                    No hay actividades registradas para este proyecto.
                                </CardContent>
                            </Card>
                        ) : (
                            project.tareas.map(tarea => (
                                <Link key={tarea.id} href={`/portal/tarea/${tarea.id}`} className="block group">
                                    <Card className="overflow-hidden bg-white group-hover:shadow-lg group-hover:border-blue-300 transition-all cursor-pointer">
                                        <div className="flex flex-col md:flex-row border-l-4 border-l-blue-500">
                                            <div className="p-6 flex-1 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-semibold text-lg">{tarea.tipo}</h3>
                                                        <p className="text-sm text-muted-foreground">{tarea.descripcion || "Sin descripción"}</p>
                                                    </div>
                                                    <Badge className={
                                                        tarea.estado === 'EJECUTADA' ? 'bg-green-500' :
                                                            tarea.estado === 'EN_PROCESO' ? 'bg-blue-500' : 'bg-slate-500'
                                                    }>
                                                        {tarea.estado}
                                                    </Badge>
                                                </div>

                                                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        <span className="font-medium">Programada:</span>
                                                        {new Date(tarea.fechaProgramada).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="font-medium">Duración:</span>
                                                        {tarea.duracionRealHoras ? `${tarea.duracionRealHoras}h` : 'Pendiente'}
                                                    </div>
                                                    {tarea.observaciones && (
                                                        <div className="flex items-center gap-1 text-slate-700 w-full mt-1">
                                                            <CheckCircle className="w-4 h-4 shrink-0" />
                                                            <span className="italic">"{tarea.observaciones}"</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Link to Evidence if available - Future enhancement */}
                                        </div>
                                    </Card>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
