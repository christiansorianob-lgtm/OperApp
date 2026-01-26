'use client'

import React, { useState, useEffect, useRef, Suspense, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { getProyectoById, updateProyecto } from "@/app/actions/proyectos"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2, Map as MapIcon, RotateCcw, Trash2, Crosshair, ClipboardList, Plus } from "lucide-react"
import dynamic from "next/dynamic"
import { Combobox } from "@/components/ui/combobox"

// Dynamic Map import
const MapPicker = dynamic(() => import("@/components/ui/MapPicker"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted flex items-center justify-center">Cargando Mapa...</div>
})

function EditProyectoForm() {
    const params = useParams()
    const router = useRouter()

    // Safety check for params
    const id = params?.id ? String(params.id) : ""

    const [loading, setLoading] = useState(true)

    // Catalog State


    // Form State
    const [clienteId, setClienteId] = useState("")
    const [clienteName, setClienteName] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [errorDetail, setErrorDetail] = useState("")

    // Form Fields
    const [nombre, setNombre] = useState("")
    const [codigo, setCodigo] = useState("")
    // const [areaHa, setAreaHa] = useState("") // Schema Proyecto does not have area
    const [observaciones, setObservaciones] = useState("")

    // Map State
    const [showMap, setShowMap] = useState(false)
    const [lat, setLat] = useState("")
    const [lng, setLng] = useState("")
    const mapRef = useRef<any>(null)
    const [drawingMode, setDrawingMode] = useState(false)
    const [polygonPoints, setPolygonPoints] = useState<any[]>([])

    // Map Overlays
    const [activeRefPolygon, setActiveRefPolygon] = useState<any[]>([])
    const [activeOtherPolygons, setActiveOtherPolygons] = useState<any[]>([])

    useEffect(() => {
        async function load() {
            try {

                // 2. Load Proyecto Data
                const resProyecto = await getProyectoById(id)
                if (resProyecto.error || !resProyecto.data) {
                    throw new Error(resProyecto.error || "Proyecto no encontrado")
                }

                const proyecto = resProyecto.data
                setClienteId(proyecto.clienteId)
                setClienteName(proyecto.cliente.nombre) // Display only
                setNombre(proyecto.nombre)
                setCodigo(proyecto.codigo || "")
                // setAreaHa(proyecto.areaHa.toString()) // Removed from schema

                setObservaciones(proyecto.observaciones || "")

                // Geo - Not in schema but maybe kept for future? Or I should comment out.
                // If I remove them from UI, I lose map editing features.
                // But updateProyecto also doesn't support them in my analysis of `src/app/actions/proyectos.ts`.
                // Checking `proyectos.ts`: `createProyecto` and `updateProyecto` do NOT handle lat/lng/area.
                // So I should disable/hide the map features or leave them as dead UI for now to avoid large refactor validation.
                // I will Comment out the state setting to avoid errors if fields missing.
                /*
                if (frente.latitud) setLat(frente.latitud.toString())
                if (frente.longitud) setLng(frente.longitud.toString())
                if (frente.poligono) ...
                */
                // Since the action doesn't save them, there is no point showing them. I will hide the map card or comment it out.

            } catch (e: any) {
                console.error(e)
                setErrorDetail(e.message)
                setShowErrorModal(true)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorDetail("")

        try {
            const formData = new FormData()
            formData.append('nombre', nombre)
            // formData.append('areaHa', areaHa)
            formData.append('observaciones', observaciones)

            // Geo fields not supported by schema/action currently
            // if (lat) formData.append('latitud', lat)
            // if (lng) formData.append('longitud', lng)
            // if (polygonPoints.length > 0) formData.append('poligono', JSON.stringify(polygonPoints))

            const res = await updateProyecto(id, formData)

            if (res.error) {
                throw new Error(res.error)
            }

            // Success
            window.location.href = `/clientes/${clienteId}`

        } catch (error: any) {
            console.error(error)
            setErrorDetail(String(error.message))
            setShowErrorModal(true)
        } finally {
            setIsSubmitting(false)
        }
    }



    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/clientes/${clienteId}`}>
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-primary">Editar Proyecto</h2>
                    <p className="text-muted-foreground">{nombre} ({codigo}) - {clienteName}</p>
                </div>
                <div className="ml-auto">
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/tareas?proyectoId=${id}`}>
                                <ClipboardList className="mr-2 h-4 w-4" />
                                Ver Tareas
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/tareas/new?clienteId=${clienteId}&proyectoId=${id}`}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Tarea
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* ERROR MODAL */}
            {showErrorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-red-500">
                        <div className="bg-red-500 text-white px-4 py-2 font-bold flex justify-between items-center">
                            <span>Error</span>
                            <button onClick={() => setShowErrorModal(false)} className="text-white hover:text-red-200">✕</button>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {errorDetail || "Ocurrió un error desconocido."}
                            </p>
                            <Button type="button" onClick={() => setShowErrorModal(false)}>Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* <div className="fixed inset-0 z-[100] bg-background flex flex-col"> ... Map Modal Removed ... </div> */}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Map Card Removed */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Información Básica</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="codigo">Código Proyecto</Label>
                                <Input
                                    id="codigo"
                                    value={codigo}
                                    readOnly
                                    className="bg-muted text-muted-foreground cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre Proyecto</Label>
                                <Input
                                    id="nombre"
                                    value={nombre}
                                    onChange={e => setNombre(e.target.value)}
                                    placeholder="Ej: Proyecto Norte"
                                    required
                                />
                            </div>
                            {/* Area Input Removed */}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Observaciones</CardTitle></CardHeader>
                    <CardContent>
                        <Input
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                            placeholder="Notas adicionales..."
                        />
                    </CardContent>
                </Card>

                <div className="pt-4 flex justify-end gap-3">
                    <Button variant="outline" type="button" asChild>
                        <Link href={`/clientes/${clienteId}`}>Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : <><Save className="mr-2 w-4 h-4" /> Actualizar Proyecto</>}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default function EditProyectoPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
            <EditProyectoForm />
        </Suspense>
    )
}
