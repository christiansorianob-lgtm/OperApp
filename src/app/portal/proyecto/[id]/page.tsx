import { getClientSession } from "@/app/actions/auth-client"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, CheckCircle, Clock } from "lucide-react"

export const dynamic = 'force-dynamic'

interface Props {
    params: Promise<{ id: string }>
}

export default async function ProjectDetailPage(props: Props) {
    const params = await props.params;
    const session = await getClientSession()
    if (!session) redirect("/portal/login")

    const project = await db.proyecto.findUnique({
        where: { id: params.id },
        include: {
            tareas: {
                orderBy: { fechaProgramada: 'desc' },
                include: {
                    trazabilidad: { take: 1, orderBy: { timestamp: 'desc' } }
                }
            },
            maquinarias: {
                where: { estado: { not: 'FUERA_DE_SERVICIO' } }
            }
        }
    })

    // Security Check: Ensure project belongs to this client
    if (!project || project.clienteId !== session.id) {
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
                        <span>{project.municipio}, {project.departamento}</span>
                        <span className="text-slate-300">•</span>
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

            <Tabs defaultValue="actividades">
                <TabsList>
                    <TabsTrigger value="actividades">Cronograma y Avance</TabsTrigger>
                    <TabsTrigger value="maquinaria">Maquinaria en Sitio</TabsTrigger>
                </TabsList>

                <TabsContent value="actividades" className="space-y-4 mt-4">
                    <div className="grid gap-4">
                        {project.tareas.length === 0 ? (
                            <p className="text-muted-foreground text-center py-10">No hay actividades registradas.</p>
                        ) : (
                            project.tareas.map(tarea => (
                                <Card key={tarea.id} className="overflow-hidden">
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

                                            <div className="flex gap-6 pt-2 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(tarea.fechaProgramada).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {tarea.duracionRealHoras ? `${tarea.duracionRealHoras}h reales` : 'En proceso'}
                                                </div>
                                                {tarea.observaciones && (
                                                    <div className="flex items-center gap-1 text-slate-700">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Observaciones: {tarea.observaciones}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Evidence Section - Simplified */}
                                        {tarea.evidencias && (
                                            <div className="bg-slate-50 p-4 w-full md:w-64 border-t md:border-t-0 md:border-l flex flex-col justify-center items-center gap-2">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">Evidencia</p>
                                                {/* In a real app, parse comma separated URLs or JSON */}
                                                <div className="w-20 h-20 bg-slate-200 rounded flex items-center justify-center text-slate-400">
                                                    📷
                                                </div>
                                                <p className="text-xs text-center text-muted-foreground truncate w-full px-2">
                                                    {tarea.evidencias}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="maquinaria" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {project.maquinarias.map(maq => (
                            <Card key={maq.id}>
                                <CardHeader>
                                    <CardTitle className="text-base">{maq.modelo}</CardTitle>
                                    <CardDescription>{maq.serialPlaca}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Badge variant="secondary">{maq.estado}</Badge>
                                </CardContent>
                            </Card>
                        ))}
                        {project.maquinarias.length === 0 && (
                            <p className="text-muted-foreground col-span-full text-center py-10">
                                No hay maquinaria asignada exclusivamente a este proyecto.
                            </p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
