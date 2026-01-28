'use client'

import React, { useState, useEffect, useRef, Suspense, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { getProyectoById, updateProyecto } from "@/app/actions/proyectos"
import { getDepartamentos, getMunicipios } from "@/app/actions/locations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2, Map as MapIcon, RotateCcw, Trash2, Crosshair, ClipboardList, Plus } from "lucide-react"
import dynamic from "next/dynamic"
import { DatePicker } from "@/components/ui/DatePicker"
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
    const [departamentos, setDepartamentos] = useState<any[]>([])
    const [municipios, setMunicipios] = useState<any[]>([])

    // Form State
    const [clienteId, setClienteId] = useState("")
    const [clienteName, setClienteName] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [errorDetail, setErrorDetail] = useState("")

    // Form Fields
    const [nombre, setNombre] = useState("")
    const [codigo, setCodigo] = useState("")
    const [descripcion, setDescripcion] = useState("")
    const [observaciones, setObservaciones] = useState("")

    // Location Fields
    const [selectedDepartamentoId, setSelectedDepartamentoId] = useState("")
    const [selectedMunicipioId, setSelectedMunicipioId] = useState("")
    const [direccion, setDireccion] = useState("")

    // Date Fields
    const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined)

    useEffect(() => {
        async function load() {
            try {
                // 1. Load Catalogs & Project in parallel
                const [resDept, resProyecto] = await Promise.all([
                    getDepartamentos(),
                    getProyectoById(id)
                ])

                const depts = resDept.data || []
                setDepartamentos(depts)

                if (resProyecto.error || !resProyecto.data) {
                    throw new Error(resProyecto.error || "Proyecto no encontrado")
                }

                const proyecto = resProyecto.data
                setClienteId(proyecto.clienteId)
                setClienteName(proyecto.cliente.nombre)
                setNombre(proyecto.nombre)
                setCodigo(proyecto.codigo || "")
                setDescripcion(proyecto.descripcion || "")
                setObservaciones(proyecto.observaciones || "")
                setDireccion(proyecto.direccion || "")

                if (proyecto.fechaInicio) {
                    setFechaInicio(new Date(proyecto.fechaInicio))
                } else {
                    setFechaInicio(new Date())
                }

                // Pre-fill Location
                // Find Department ID by Name
                if (proyecto.departamento) {
                    const foundDept = depts.find((d: any) => d.nombre === proyecto.departamento)
                    if (foundDept) {
                        setSelectedDepartamentoId(foundDept.id)

                        // Load Municipios for this Dept
                        const resMuni = await getMunicipios(foundDept.id)
                        const munis = resMuni.data || []
                        setMunicipios(munis)

                        // Find Municipio ID by Name
                        if (proyecto.municipio) {
                            const foundMuni = munis.find((m: any) => m.nombre === proyecto.municipio)
                            if (foundMuni) {
                                setSelectedMunicipioId(foundMuni.id)
                            }
                        }
                    }
                }

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

    const handleDepartamentoSelect = async (id: string) => {
        setSelectedDepartamentoId(id)
        setSelectedMunicipioId("")
        setMunicipios([])

        if (id) {
            const res = await getMunicipios(id)
            if (res.data) {
                setMunicipios(res.data)
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorDetail("")

        try {
            const formData = new FormData()
            formData.append('nombre', nombre)
            formData.append('descripcion', descripcion)
            formData.append('observaciones', observaciones)

            // Location Names
            const depName = departamentos.find(d => d.id === selectedDepartamentoId)?.nombre || ""
            const munName = municipios.find(m => m.id === selectedMunicipioId)?.nombre || ""

            formData.append('departamento', depName)
            formData.append('municipio', munName)
            formData.append('direccion', direccion)

            if (fechaInicio) formData.append('fechaInicio', fechaInicio.toISOString())

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

    const departamentoOptions = useMemo(() => departamentos.map(d => ({
        value: d.id,
        label: d.nombre
    })), [departamentos])

    const municipioOptions = useMemo(() => municipios.map(m => ({
        value: m.id,
        label: m.nombre
    })), [municipios])

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
                {/* Actions removed for simplicity as requested/not needed here */}
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

            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
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
                                <div className="space-y-2">
                                    <Label htmlFor="descripcion">Descripción</Label>
                                    <Textarea
                                        id="descripcion"
                                        value={descripcion}
                                        onChange={e => setDescripcion(e.target.value)}
                                        placeholder="Descripción breve..."
                                        className="resize-none"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Fechas</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Fecha Inicio</Label>
                                    <DatePicker date={fechaInicio} setDate={setFechaInicio} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Ubicación</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Departamento</Label>
                                        <Combobox
                                            options={departamentoOptions}
                                            value={selectedDepartamentoId}
                                            onSelect={handleDepartamentoSelect}
                                            placeholder="Seleccione..."
                                            searchPlaceholder="Buscar..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Municipio</Label>
                                        <Combobox
                                            options={municipioOptions}
                                            value={selectedMunicipioId}
                                            onSelect={setSelectedMunicipioId}
                                            placeholder="Seleccione..."
                                            searchPlaceholder="Buscar..."
                                            emptyText={selectedDepartamentoId ? "No encontrado" : "Seleccione depto"}
                                            disabled={!selectedDepartamentoId}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="direccion">Dirección / Punto Referencia</Label>
                                    <Input
                                        id="direccion"
                                        value={direccion}
                                        onChange={e => setDireccion(e.target.value)}
                                        placeholder="Ej: Km 5 Vía La Calera"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Detalles Adicionales</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="observaciones">Observaciones</Label>
                                    <Textarea
                                        id="observaciones"
                                        value={observaciones}
                                        onChange={e => setObservaciones(e.target.value)}
                                        placeholder="Notas internas..."
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

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
