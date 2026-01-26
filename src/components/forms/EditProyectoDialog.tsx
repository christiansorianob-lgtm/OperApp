'use client'

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { updateProyecto } from "@/app/actions/proyectos"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Map as MapIcon, Trash2, Save, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

// Dynamic Map import excluded since not needed

interface EditProyectoDialogProps {
    proyecto: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function EditProyectoDialog({ proyecto, open, onOpenChange, onSuccess }: EditProyectoDialogProps) {
    const router = useRouter()

    // Form State
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorDetail, setErrorDetail] = useState("")

    // Form Fields
    const [nombre, setNombre] = useState("")
    const [observaciones, setObservaciones] = useState("")

    // Initialize Data
    useEffect(() => {
        if (open && proyecto) {
            setNombre(proyecto.nombre)
            setObservaciones(proyecto.observaciones || "")
        }
    }, [open, proyecto])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorDetail("")

        try {
            const formData = new FormData()
            formData.append('nombre', nombre)
            formData.append('observaciones', observaciones)

            const res = await updateProyecto(proyecto.id, formData)

            if (res.error) {
                throw new Error(res.error)
            }

            // Success
            onOpenChange(false)
            if (onSuccess) onSuccess()
            router.refresh()

        } catch (error: any) {
            console.error(error)
            setErrorDetail(String(error.message))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md w-full">
                <DialogHeader>
                    <DialogTitle>Editar Proyecto: {proyecto?.codigo}</DialogTitle>
                </DialogHeader>

                {errorDetail && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{errorDetail}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                        <Label>Observaciones</Label>
                        <Input value={observaciones} onChange={e => setObservaciones(e.target.value)} />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
