'use client'

import Link from "next/link"
import { useState, useEffect, useRef, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getClientes } from "@/app/actions/clientes"
import { createProyecto } from "@/app/actions/proyectos"
import { getDepartamentos, getMunicipios } from "@/app/actions/locations"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, Loader2 } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"
import { GoBackButton } from "@/components/ui/GoBackButton"
import { DatePicker } from "@/components/ui/DatePicker"

function ProyectoForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const preClienteId = searchParams?.get('clienteId')

    const [clientes, setClientes] = useState<any[]>([])
    const [loadingClientes, setLoadingClientes] = useState(true)

    // Location State
    const [departamentos, setDepartamentos] = useState<any[]>([])
    const [municipios, setMunicipios] = useState<any[]>([])
    const [selectedDepartamentoId, setSelectedDepartamentoId] = useState("")
    const [selectedMunicipioId, setSelectedMunicipioId] = useState("")

    // Form State
    const [selectedCliente, setSelectedCliente] = useState(preClienteId || "")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [errorDetail, setErrorDetail] = useState("")

    // Date State
    const [fechaInicio, setFechaInicio] = useState<Date | undefined>(new Date())

    useEffect(() => {
        async function load() {
            try {
                const [cliRes, depRes] = await Promise.all([getClientes(), getDepartamentos()])

                if (cliRes.data) {
                    setClientes(cliRes.data)
                }
                if (depRes.data) {
                    setDepartamentos(depRes.data)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoadingClientes(false)
            }
        }
        load()
    }, [preClienteId])

    const handleClienteSelect = (id: string) => {
        setSelectedCliente(id)
    }

    const handleDepartamentoSelect = async (id: string) => {
        setSelectedDepartamentoId(id)
        setSelectedMunicipioId("") // Reset municipio
        setMunicipios([])

        if (id) {
            const res = await getMunicipios(id)
            if (res.data) {
                setMunicipios(res.data)
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorDetail("")

        try {
            const formData = new FormData(e.currentTarget)

            // Append manually handled fields
            formData.set('clienteId', selectedCliente)

            // Resolve Names from IDs for Location
            const depName = departamentos.find(d => d.id === selectedDepartamentoId)?.nombre || ""
            const munName = municipios.find(m => m.id === selectedMunicipioId)?.nombre || ""

            formData.set('departamento', depName)
            formData.set('municipio', munName)

            // Date
            if (fechaInicio) {
                formData.set('fechaInicio', fechaInicio.toISOString())
            }

            const res = await createProyecto(formData)

            if (res?.error) {
                throw new Error(res.error)
            }

            if (res?.success) {
                router.push('/proyectos')
                router.refresh()
            }

        } catch (error: any) {
            console.error(error)
            setErrorDetail(String(error.message))
            setShowErrorModal(true)
            setIsSubmitting(false)
        }
    }

    const clienteOptions = useMemo(() => clientes.map(c => ({
        value: c.id,
        label: `${c.nombre} (${c.codigo})`
    })), [clientes])

    const departamentoOptions = useMemo(() => departamentos.map(d => ({
        value: d.id,
        label: d.nombre
    })), [departamentos])

    const municipioOptions = useMemo(() => municipios.map(m => ({
        value: m.id,
        label: m.nombre
    })), [municipios])

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <GoBackButton fallbackRoute={`/clientes/${selectedCliente || ''}`} />
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-primary">Nuevo Proyecto</h2>
                    <p className="text-muted-foreground">Registre un proyecto vinculado a un cliente</p>
                </div>
            </div>

            {/* ERROR MODAL */}
            {showErrorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-red-500">
                        <div className="bg-red-500 text-white px-4 py-2 font-bold flex justify-between items-center">
                            <span>Error al Guardar</span>
                            <button onClick={() => setShowErrorModal(false)} className="text-white hover:text-red-200">✕</button>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {errorDetail}
                            </p>
                            <div className="flex justify-end gap-2">
                                <Button type="button" onClick={() => setShowErrorModal(false)}>Cerrar</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="clienteId">Cliente</Label>
                            <Combobox
                                options={clienteOptions}
                                value={selectedCliente}
                                onSelect={handleClienteSelect}
                                placeholder="Seleccione Cliente..."
                                searchPlaceholder="Buscar Cliente..."
                                emptyText="No encontrado"
                                disabled={!!preClienteId}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Información Básica</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="codigo">Código Proyecto</Label>
                                    <Input
                                        id="codigo"
                                        name="codigo"
                                        placeholder="Autogenerado al guardar"
                                        readOnly
                                        className="bg-muted text-muted-foreground cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nombre">Nombre Proyecto</Label>
                                    <Input id="nombre" name="nombre" placeholder="Ej: Proyecto Norte" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="descripcion">Descripción</Label>
                                    <Textarea id="descripcion" name="descripcion" placeholder="Descripción breve del alcance..." className="resize-none" />
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
                                            searchPlaceholder="Buscar depto..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Municipio</Label>
                                        <Combobox
                                            options={municipioOptions}
                                            value={selectedMunicipioId}
                                            onSelect={setSelectedMunicipioId}
                                            placeholder="Seleccione..."
                                            searchPlaceholder="Buscar municipio..."
                                            emptyText={selectedDepartamentoId ? "No encontrado" : "Seleccione depto"}
                                            disabled={!selectedDepartamentoId}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="direccion">Dirección / Punto Referencia</Label>
                                    <Input id="direccion" name="direccion" placeholder="Ej: Km 5 Vía La Calera" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Detalles Adicionales</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="observaciones">Observaciones</Label>
                                    <Textarea id="observaciones" name="observaciones" placeholder="Notas internas..." />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <GoBackButton variant="outline" size="default" fallbackRoute={`/clientes`}>
                        Cancelar
                    </GoBackButton>
                    <Button type="submit" disabled={isSubmitting || !selectedCliente}>
                        {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : <><Save className="mr-2 w-4 h-4" /> Guardar Proyecto</>}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default function NewProyectoPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
            <ProyectoForm />
        </Suspense>
    )
}
