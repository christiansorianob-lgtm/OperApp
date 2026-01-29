'use client';

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, User, ArrowLeft, CheckCircle, X } from "lucide-react"
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog"
import dynamic from "next/dynamic"

// Dynamic import for Map to avoid SSR issues
const MapViewer = dynamic(() => import("@/components/ui/MapViewer"), {
    loading: () => <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />,
    ssr: false
})

interface PortalTaskDetailViewProps {
    tarea: any
}

export function PortalTaskDetailView({ tarea }: PortalTaskDetailViewProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    const getSafeImageSrc = (base64OrUrl: string) => {
        if (!base64OrUrl) return "/placeholder.png"
        if (base64OrUrl.startsWith("data:")) return base64OrUrl
        if (base64OrUrl.startsWith("http")) return base64OrUrl
        // If it starts with / but is very long, it's likely a base64 string (like /9j/...)
        if (base64OrUrl.startsWith("/") && base64OrUrl.length < 500) return base64OrUrl
        return `data:image/jpeg;base64,${base64OrUrl}`
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
                                                        src={getSafeImageSrc(report.fotoAntes)}
                                                        alt="Foto Antes"
                                                        className="w-full aspect-[4/3] object-cover rounded-md border bg-white cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                                                        onClick={() => setSelectedImage(getSafeImageSrc(report.fotoAntes))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-200 px-2 py-1 rounded w-fit">DESPUÉS</span>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={getSafeImageSrc(report.fotoDespues)}
                                                        alt="Foto Después"
                                                        className="w-full aspect-[4/3] object-cover rounded-md border bg-white cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                                                        onClick={() => setSelectedImage(getSafeImageSrc(report.fotoDespues))}
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
                                <div className="grid grid-cols-2 gap-2">
                                    {(tarea.evidencias ? tarea.evidencias.split(/[\n\s]+/).filter(Boolean) : []).map((url: string, i: number) => (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            key={i}
                                            src={getSafeImageSrc(url)}
                                            alt={`Evidencia ${i + 1}`}
                                            className="w-full aspect-square object-cover rounded-md border cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                                            onClick={() => setSelectedImage(getSafeImageSrc(url))}
                                        />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Lightbox Dialog */}
            <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-black/95 flex items-center justify-center">
                    <DialogTitle className="sr-only">Imagen Detallada</DialogTitle>
                    <DialogClose className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-all z-50">
                        <X className="h-6 w-6" />
                        <span className="sr-only">Cerrar</span>
                    </DialogClose>
                    {selectedImage && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={selectedImage}
                            alt="Vista Completa"
                            className="max-w-full max-h-[90vh] object-contain"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
