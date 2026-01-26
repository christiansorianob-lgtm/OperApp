'use client'

import Link from "next/link"
import { useState, useEffect, useRef, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getClientes } from "@/app/actions/clientes"
import { createProyecto } from "@/app/actions/proyectos"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Loader2 } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"
import { GoBackButton } from "@/components/ui/GoBackButton"

function ProyectoForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const preClienteId = searchParams?.get('clienteId')

    const [clientes, setClientes] = useState<any[]>([])
    const [loadingClientes, setLoadingClientes] = useState(true)

    // Form State
    const [selectedCliente, setSelectedCliente] = useState(preClienteId || "")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [errorDetail, setErrorDetail] = useState("")

    useEffect(() => {
        async function load() {
            try {
                // Load Clientes
                const res = await getClientes()
                if (res.data) {
                    setClientes(res.data)
                    if (preClienteId) {
                        const target = res.data.find((c: any) => c.id === preClienteId)
                        // No map context update needed
                    }
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorDetail("")

        try {
            const formData = new FormData(e.currentTarget)

            // Map state to formData
            // No map data to append

            // Re-construct payload manually to be safe or append to formData
            formData.set('clienteId', selectedCliente)

            const res = await createProyecto(formData)

            if (res?.error) {
                throw new Error(res.error)
            }

            if (res?.success) {
                // Success
                const target = preClienteId ? `/clientes` : '/proyectos' // Or `/clientes/${preClienteId}`
                // If came from client, go back to client list or detail?
                // For now go to /proyectos as default or /clientes if pre-selected.
                // Better: Go to /proyectos usually.
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
                            {/* Hidden input for formData if needed or handled manually */}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Detalles</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="observaciones">Observaciones</Label>
                                <Input id="observaciones" name="observaciones" placeholder="Notas adicionales..." />
                            </div>
                        </CardContent>
                    </Card>
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
