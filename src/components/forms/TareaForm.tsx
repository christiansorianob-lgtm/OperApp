'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createTarea } from '@/app/actions/tareas'
import { createTipoActividad, getTiposActividad, createResponsable, getResponsables, updateResponsable, deleteResponsable, getCargos, createCargo, deleteCargo } from "@/app/actions/configuracion"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Loader2 } from 'lucide-react'
import { Combobox } from "@/components/ui/combobox"
import { QuickCreateDialog } from "@/components/common/QuickCreateDialog"
import { ManageResponsablesDialog } from "@/components/forms/ManageResponsablesDialog"
import { GoBackButton } from "@/components/ui/GoBackButton"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ExternalLink } from "lucide-react"

// Types for props
interface Cliente {
    id: string
    nombre: string
    codigo: string
}

interface Proyecto {
    id: string
    nombre: string
    codigo: string
    clienteId: string
}

interface TareaFormProps {
    clientes: Cliente[]
    proyectos: Proyecto[]
    tiposActividad: { id: string, nombre: string }[]
    responsables: { id: string, nombre: string, celular?: string | null }[]
    cargos: { id: string, nombre: string }[]
}

export function TareaForm({ clientes, proyectos, tiposActividad: initialTipos, responsables: initialResponsables, cargos: initialCargos }: TareaFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Local state for catalogs
    const [tiposActividad, setTiposActividad] = useState(initialTipos)
    const [responsables, setResponsables] = useState(initialResponsables)
    const [cargos, setCargos] = useState(initialCargos)

    const initialClienteId = searchParams?.get('clienteId') || ""
    const initialProyectoId = searchParams?.get('proyectoId') || ""

    const [selectedCliente, setSelectedCliente] = useState<string>(initialClienteId)
    const [selectedProyecto, setSelectedProyecto] = useState<string>(initialProyectoId)

    // Controlled states for other Comboboxes
    const [selectedTipo, setSelectedTipo] = useState("")
    const [selectedResponsable, setSelectedResponsable] = useState("")
    const [selectedPrioridad, setSelectedPrioridad] = useState("MEDIA")
    const [selectedEstado, setSelectedEstado] = useState("PROGRAMADA")
    const [fechaProgramada, setFechaProgramada] = useState(new Date().toISOString().split('T')[0])

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [createdTask, setCreatedTask] = useState<{ id: string, responsableId: string, tipo: string, proyectoNombre: string } | null>(null)

    // Data Refresh Handlers
    const refreshTipos = async () => {
        const res = await getTiposActividad()
        if (res.data) setTiposActividad(res.data)
    }

    const refreshResponsables = async () => {
        const res = await getResponsables()
        if (res.data) setResponsables(res.data)
    }

    const refreshCargos = async () => {
        const res = await getCargos()
        if (res.data) setCargos(res.data)
    }

    // Filter proyectos based on selected Cliente
    const proyectoOptions = useMemo(() => {
        if (!selectedCliente) return []
        return proyectos
            .filter(p => p.clienteId === selectedCliente)
            .map(p => ({ value: p.id, label: `${p.nombre} (${p.codigo})` }))
    }, [selectedCliente, proyectos])

    // Options for Comboboxes
    const clienteOptions = clientes.map(c => ({ value: c.id, label: `${c.nombre} (${c.codigo})` }))

    const tipoOptions = tiposActividad.map(t => ({ value: t.id, label: t.nombre }))
    const responsableOptions = responsables.map(r => ({ value: r.id, label: r.nombre }))

    const prioridadOptions = [
        { value: "ALTA", label: "Alta" },
        { value: "MEDIA", label: "Media" },
        { value: "BAJA", label: "Baja" }
    ]

    const estadoOptions = [
        { value: "PROGRAMADA", label: "Programada" },
        { value: "EN_PROCESO", label: "En Progreso" },
        { value: "CANCELADA", label: "Cancelada" }
    ]

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        // Ensure manual fields are set if needed (though hidden inputs handle most)
        // We rely on hidden inputs for IDs

        try {
            const result = await createTarea(formData)

            if (result?.error) {
                alert(result.error)
                setIsSubmitting(false)
            } else if (result?.success) {
                // Success!
                const proyecto = proyectos.find(p => p.id === selectedProyecto)

                setCreatedTask({
                    id: "new",
                    responsableId: selectedResponsable,
                    tipo: tiposActividad.find(t => t.id === selectedTipo)?.nombre || "Tarea",
                    proyectoNombre: proyecto?.nombre || "Proyecto"
                })
                setIsSubmitting(false)
            }
        } catch (e) {
            console.error(e)
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        router.back()
    }

    const handleNotify = () => {
        if (!createdTask) return

        const resp = responsables.find(r => r.id === createdTask.responsableId)
        if (resp && resp.celular) {
            const message = `Hola ${resp.nombre}, se te ha asignado una nueva tarea: *${createdTask.tipo}* en *${createdTask.proyectoNombre}*`
            const whatsappUrl = `https://wa.me/57${resp.celular}?text=${encodeURIComponent(message)}`
            window.open(whatsappUrl, '_blank')
        }

        router.push("/tareas")
        router.refresh()
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <GoBackButton fallbackRoute="/tareas" />
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-primary">Nueva Tarea</h2>
                    <p className="text-muted-foreground">Programe una actividad de campo</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalles de la Actividad</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-6">

                        {/* Hidden Inputs mapped to Backend Expected Field Names */}
                        {/* Backend expects 'obraId' (Client) and 'frenteId' (Project) */}
                        <input type="hidden" name="obraId" value={selectedCliente} />
                        <input type="hidden" name="frenteId" value={selectedProyecto} />

                        <input type="hidden" name="tipo" value={tiposActividad.find(t => t.id === selectedTipo)?.nombre || ""} />
                        <input type="hidden" name="responsable" value={responsables.find(r => r.id === selectedResponsable)?.nombre || ""} />
                        <input type="hidden" name="prioridad" value={selectedPrioridad} />
                        <input type="hidden" name="estado" value={selectedEstado} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="obraId">Cliente</Label>
                                <Combobox
                                    options={clienteOptions}
                                    value={selectedCliente}
                                    onSelect={(val) => {
                                        setSelectedCliente(val)
                                        setSelectedProyecto("") // Reset project when client changes
                                    }}
                                    placeholder="Seleccione un Cliente..."
                                    searchPlaceholder="Buscar cliente..."
                                    emptyText="No encontrado."
                                    disabled={!!initialClienteId}
                                />
                            </div>
                        </div>

                        {/* Proyecto Selector - Now Mandatory logic visually */}
                        {selectedCliente && (
                            <div className="space-y-2 p-4 border rounded-md bg-muted/20">
                                <Label htmlFor="frenteId">Proyecto (Obligatorio)</Label>
                                <Combobox
                                    options={proyectoOptions}
                                    value={selectedProyecto}
                                    onSelect={setSelectedProyecto}
                                    placeholder="Seleccione un Proyecto..."
                                    searchPlaceholder="Buscar proyecto..."
                                    emptyText="No hay proyectos registrados para este cliente."
                                    disabled={proyectoOptions.length === 0 || !!initialProyectoId}
                                />
                                {proyectoOptions.length === 0 && (
                                    <p className="text-xs text-red-500">Este cliente no tiene proyectos activos.</p>
                                )}
                            </div>
                        )}
                        {!selectedCliente && (
                            <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground text-sm">
                                Seleccione un cliente para ver sus proyectos disponibles.
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="tipo">Tipo de Actividad</Label>
                                    <QuickCreateDialog
                                        triggerLabel="Administrar"
                                        title="Nuevo Tipo de Actividad"
                                        description="Agregue un nuevo tipo de actividad."
                                        placeholder="Ej: Fertilización"
                                        action={createTipoActividad}
                                        onSuccess={refreshTipos}
                                    />
                                </div>
                                <Combobox
                                    options={tipoOptions}
                                    value={selectedTipo}
                                    onSelect={setSelectedTipo}
                                    placeholder="Seleccione tipo..."
                                    searchPlaceholder="Buscar tipo..."
                                    emptyText="No encontrado."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fechaProgramada">Fecha Programada</Label>
                                <Input
                                    id="fechaProgramada"
                                    name="fechaProgramada"
                                    type="date"
                                    value={fechaProgramada}
                                    onChange={(e) => setFechaProgramada(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="responsable">Responsable</Label>
                                    <ManageResponsablesDialog
                                        responsables={responsables as any}
                                        cargos={cargos}
                                        createAction={createResponsable}
                                        updateAction={updateResponsable}
                                        deleteAction={deleteResponsable}
                                        createCargoAction={createCargo}
                                        deleteCargoAction={deleteCargo}
                                        onRefreshCargos={refreshCargos}
                                        onSuccess={refreshResponsables}
                                    />
                                </div>
                                <Combobox
                                    options={responsableOptions}
                                    value={selectedResponsable}
                                    onSelect={setSelectedResponsable}
                                    placeholder="Seleccione responsable..."
                                    searchPlaceholder="Buscar responsable..."
                                    emptyText="No encontrado."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="prioridad">Prioridad</Label>
                                    <Combobox
                                        options={prioridadOptions}
                                        value={selectedPrioridad}
                                        onSelect={setSelectedPrioridad}
                                        placeholder="Seleccione prioridad..."
                                        searchPlaceholder="Buscar prioridad..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="estado">Estado Inicial</Label>
                                    <Combobox
                                        options={estadoOptions}
                                        value={selectedEstado}
                                        onSelect={setSelectedEstado}
                                        placeholder="Seleccione estado..."
                                        searchPlaceholder="Buscar estado..."
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="observaciones">Observaciones</Label>
                            <Input id="observaciones" name="observaciones" placeholder="Notas adicionales..." />
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="requiereTrazabilidad"
                                    name="requiereTrazabilidad"
                                    defaultChecked
                                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <Label htmlFor="requiereTrazabilidad">Requiere Trazabilidad GPS</Label>
                            </div>
                            <p className="text-xs text-muted-foreground ml-6">
                                Activa el rastreo continuo de ubicación.
                            </p>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="outline" type="button" onClick={() => router.back()}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting || !selectedCliente || !selectedProyecto}>
                                {isSubmitting ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : <Save className="mr-2 w-4 h-4" />}
                                Guardar Tarea
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={!!createdTask} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¡Tarea Creada!</DialogTitle>
                        <DialogDescription>
                            La actividad se ha programado correctamente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <p className="text-sm text-muted-foreground mb-2">
                            ¿Deseas notificar al responsable vía WhatsApp ahora mismo?
                        </p>
                    </div>

                    <DialogFooter className="flex gap-2 sm:justify-end">
                        <Button variant="secondary" onClick={handleClose}>
                            No, salir
                        </Button>
                        <Button onClick={handleNotify} className="bg-green-600 hover:bg-green-700">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Notificar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
