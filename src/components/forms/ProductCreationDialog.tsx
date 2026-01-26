'use client'

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Combobox } from "@/components/ui/combobox"
import { Loader2, Plus } from "lucide-react"
import { createProducto } from "@/app/actions/almacen"
import { getCategoriasProducto, getUnidadesMedida } from "@/app/actions/configuracion"

import { getProyectos as getAllProyectos } from "@/app/actions/proyectos"

// Simplified dialog for creating a product on the fly
export function ProductCreationDialog({ onProductCreated, defaultProyectoId }: { onProductCreated?: (product: any) => void, defaultProyectoId?: string }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Data State
    const [proyectos, setProyectos] = useState<any[]>([])
    const [categorias, setCategorias] = useState<any[]>([])
    const [unidades, setUnidades] = useState<any[]>([])

    // Form State
    const [proyectoId, setProyectoId] = useState(defaultProyectoId || "")
    const [categoria, setCategoria] = useState("")
    const [nombre, setNombre] = useState("")
    const [unidadMedida, setUnidadMedida] = useState("")
    const [cantidad, setCantidad] = useState("")
    const [error, setError] = useState("")

    useEffect(() => {
        if (open) {
            loadCatalogs()
        }
    }, [open])

    async function loadCatalogs() {
        setLoading(true)
        try {
            const [resProyectos, resCats, resUnits] = await Promise.all([
                getAllProyectos(),
                getCategoriasProducto(),
                getUnidadesMedida()
            ])
            if (resProyectos.data) setProyectos(resProyectos.data)
            if (resCats.data) setCategorias(resCats.data)
            if (resUnits.data) setUnidades(resUnits.data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)
        setError("")

        const formData = new FormData()
        formData.append("proyectoId", proyectoId)
        formData.append("categoria", categoria)
        formData.append("nombre", nombre)
        formData.append("unidadMedida", unidadMedida)
        formData.append("cantidad", cantidad)
        formData.append("disable_redirect", "true")

        const res = await createProducto(formData)

        if (res.error) {
            setError(res.error)
        } else {
            setOpen(false)
            router.refresh() // Update parent lists
            if (onProductCreated && res.data) {
                onProductCreated(res.data)
            }
            // Reset
            setNombre("")
            setCantidad("")
        }
        setIsSubmitting(false)
    }

    const projectOptions = useMemo(() => proyectos.map(p => ({ value: p.id, label: p.nombre })), [proyectos])
    const catOptions = useMemo(() => categorias.map(c => ({ value: c.nombre, label: c.nombre })), [categorias])
    const unitOptions = useMemo(() => unidades.map(u => ({ value: u.nombre, label: u.nombre })), [unidades])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-primary hover:underline px-2">
                    <Plus className="w-3 h-3 mr-1" /> Crear Nuevo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Producto</DialogTitle>
                    <DialogDescription>
                        Registre un nuevo producto en el inventario.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        <div className="space-y-2">
                            <Label>Proyecto / Bodega</Label>
                            <Combobox
                                options={projectOptions}
                                value={proyectoId}
                                onSelect={setProyectoId}
                                placeholder="Seleccione Proyecto..."
                                disabled={!!defaultProyectoId}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Categoría</Label>
                            <Combobox
                                options={catOptions}
                                value={categoria}
                                onSelect={setCategoria}
                                placeholder="Seleccione Categoría..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Nombre Comercial</Label>
                            <Input
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                placeholder="Ej: Fertilizante Triple 15"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Cantidad Inicial</Label>
                                <Input
                                    type="number" step="0.01"
                                    value={cantidad}
                                    onChange={e => setCantidad(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Unidad</Label>
                                <Combobox
                                    options={unitOptions}
                                    value={unidadMedida}
                                    onSelect={setUnidadMedida}
                                    placeholder="Und..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                                Guardar
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
