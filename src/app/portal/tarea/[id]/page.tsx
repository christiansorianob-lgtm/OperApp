import { getAdminSession } from "@/app/actions/auth"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, Clock, MapPin, User, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import MapViewer from "@/components/ui/MapViewer"

export const dynamic = 'force-dynamic'

interface Props {
    params: Promise<{ id: string }>
}

export default async function TaskDetailPage(props: Props) {
    const params = await props.params;
    const session = await getAdminSession()

    if (!session || session.role !== 'CLIENTE') {
        redirect("/login")
    }

    const tarea = await db.tarea.findUnique({
        where: { id: params.id },
        include: {
            proyecto: true,
            trazabilidad: {
                orderBy: { timestamp: 'asc' }
            },
            reportesFotograficos: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    // Security Check: Ensure task belongs to a project of this client
    if (!tarea || !tarea.proyecto || tarea.proyecto.clienteId !== session.clienteId) {
        return notFound()
    }

    return (
        <div className="space-y-6">
            <div>
                <Button variant="ghost" asChild className="pl-0 text-muted-foreground hover:text-slate-900 mb-4">
                    <Link href={`/portal/proyecto/${tarea.proyecto.id}`}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al Proyecto
                    </Link>
                </Button>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{tarea.tipo}</h1>
                            <Badge className={
                                tarea.estado === 'EJECUTADA' ? 'bg-green-600' :
                                    tarea.estado === 'EN_PROCESO' ? 'bg-blue-600' : 'bg-slate-500'
                            }>
                                {tarea.estado}
                            </Badge>
                        </div>

                        <p className="text-lg text-muted-foreground">
                            {tarea.descripcion || "Sin descripción detallada."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Detalles de Ejecución */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles de Ejecución</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <User className="w-4 h-4" /> Responsable
                                </span>
                                <p className="text-base font-semibold">{tarea.responsable}</p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Fecha Programada
                                </span>
                                <p className="text-base font-semibold">
                                    {new Date(tarea.fechaProgramada).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Duración Real
                                </span>
                                <p className="text-base font-semibold">
                                    {tarea.duracionRealHoras ? `${tarea.duracionRealHoras} Horas` : 'No registrada'}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Fecha Ejecución
                                </span>
                                <p className="text-base font-semibold">
                                    {tarea.fechaEjecucion ? new Date(tarea.fechaEjecucion).toLocaleString() : 'Pendiente'}
                                </p>
                            </div>

                            {tarea.observaciones && (
                                <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border">
                                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-4 h-4" /> Observaciones del Operario
                                    </span>
                                    <p className="text-slate-800 italic">"{tarea.observaciones}"</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Detailed Photo Reports (Portal View) */}
                    {tarea.reportesFotograficos && tarea.reportesFotograficos.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    Reporte Fotográfico Detallado
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                    {tarea.reportesFotograficos.map((report: any) => (
                                        <div key={report.id} className="bg-slate-50 p-4 rounded-lg border flex flex-col gap-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-200 px-2 py-1 rounded w-fit">ANTES</span>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={report.fotoAntes}
                                                        alt="Foto Antes"
                                                        className="w-full aspect-[4/3] object-cover rounded-md border bg-white"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-200 px-2 py-1 rounded w-fit">DESPUÉS</span>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={report.fotoDespues}
                                                        alt="Foto Después"
                                                        className="w-full aspect-[4/3] object-cover rounded-md border bg-white"
                                                    />
                                                </div>
                                            </div>
                                            {report.comentario && (
                                                <div className="mt-auto bg-white p-3 rounded border text-sm text-slate-600 italic border-l-4 border-blue-500/30">
                                                    "{report.comentario}"
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* GPS Traceability Map */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                Rastro GPS
                            </CardTitle>
                            <CardDescription>
                                Recorrido registrado durante la ejecución de la actividad.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MapViewer points={tarea.trazabilidad} />
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Información del Proyecto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Proyecto</p>
                                <p className="font-medium">{tarea.proyecto?.nombre}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Código</p>
                                <p className="font-medium">{tarea.proyecto?.codigo}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Ubicación</p>
                                <p className="font-medium">
                                    {[tarea.proyecto?.municipio, tarea.proyecto?.departamento].filter(Boolean).join(", ")}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {tarea.evidencias && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Evidencia Fotográfica</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center h-48 border">
                                    {/* Placeholder mainly, or render image if URL is valid */}
                                    <p className="text-xs text-muted-foreground p-4 text-center break-all">
                                        {tarea.evidencias}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
