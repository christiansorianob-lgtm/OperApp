'use client'

import { updateCliente } from "@/app/actions/clientes"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Loader2 } from "lucide-react"
import { useState } from "react"
import { GoBackButton } from "@/components/ui/GoBackButton"

interface EditClienteFormProps {
    cliente: any
}

export function EditClienteForm({ cliente }: EditClienteFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [errorDetail, setErrorDetail] = useState("")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const formData = new FormData(e.currentTarget)

            // Validate
            if (!formData.get('nombre')) throw new Error("El nombre es obligatorio")

            const res = await updateCliente(cliente.id, formData)

            if (res?.error) {
                setErrorDetail(res.error)
                setShowErrorModal(true)
                setIsSubmitting(false)
            } else if (res?.success) {
                // Success
                router.push(`/clientes/${cliente.id}`)
                router.refresh()
            }
        } catch (error: any) {
            console.error(error)
            setErrorDetail(String(error.message))
            setShowErrorModal(true)
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <GoBackButton fallbackRoute={`/clientes/${cliente.id}`} />
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-primary">Editar Cliente</h2>
                    <p className="text-muted-foreground">{cliente.nombre} ({cliente.codigo})</p>
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

            <Card>
                <CardHeader>
                    <CardTitle>Información del Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="codigo">Código</Label>
                                <Input
                                    id="codigo"
                                    name="codigo"
                                    defaultValue={cliente.codigo}
                                    disabled
                                    className="bg-muted text-muted-foreground"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre Cliente / Empresa</Label>
                                <Input
                                    id="nombre"
                                    name="nombre"
                                    defaultValue={cliente.nombre}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="direccion">Dirección Fiscal / Ubicación</Label>
                            <Input
                                id="direccion"
                                name="direccion"
                                defaultValue={cliente.direccion}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="responsable">Contacto Principal</Label>
                                <Input
                                    id="responsable"
                                    name="responsable"
                                    defaultValue={cliente.responsable}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="telefono">Teléfono (Opcional)</Label>
                                <Input
                                    id="telefono"
                                    name="telefono"
                                    defaultValue={cliente.telefono}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nit">NIT / Documento (Opcional)</Label>
                                <Input
                                    id="nit"
                                    name="nit"
                                    defaultValue={cliente.nit}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email (Opcional)</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={cliente.email}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="observaciones">Observaciones</Label>
                            <Input
                                id="observaciones"
                                name="observaciones"
                                defaultValue={cliente.observaciones}
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <GoBackButton variant="outline" size="default" fallbackRoute={`/clientes/${cliente.id}`}>
                                Cancelar
                            </GoBackButton>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 w-4 h-4" />
                                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
