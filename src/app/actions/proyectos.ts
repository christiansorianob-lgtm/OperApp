'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getProyectos() {
    try {
        const proyectos = await db.proyecto.findMany({
            include: {
                cliente: true
            },
            orderBy: { createdAt: 'desc' }
        })
        return { data: proyectos }
    } catch (error) {
        console.error("Failed to fetch proyectos:", error)
        return { error: "Error al cargar los proyectos." }
    }
}

export async function createProyecto(formData: FormData) {
    const clienteId = formData.get("clienteId") as string
    const nombre = formData.get("nombre") as string
    const codigo = formData.get("codigo") as string
    // const area = parseFloat(formData.get("areaHa") as string) // Project schema does NOT have area.
    const observaciones = formData.get("observaciones") as string

    if (!clienteId || !nombre) {
        return { error: "Campos obligatorios faltantes." }
    }

    try {
        // Generate code if missing
        let finalCodigo = codigo
        if (!finalCodigo) {
            const count = await db.proyecto.count({ where: { clienteId } })
            finalCodigo = `PRJ-${(count + 1).toString().padStart(3, '0')}`
        }

        await db.proyecto.create({
            data: {
                clienteId,
                codigo: finalCodigo,
                nombre,
                // area, -> Not in schema
                observaciones,
                estado: 'EN_EJECUCION' // previously ACTIVO, now EN_EJECUCION default
            }
        })
    } catch (error) {
        console.error("Failed to create proyecto:", error)
        return { error: "Error al crear el proyecto. Verifique datos." }
    }

    revalidatePath('/proyectos')
    // redirect('/proyectos') // Handled by client
    return { success: true }
}

export async function getProyectoById(id: string) {
    try {
        const proyecto = await db.proyecto.findUnique({
            where: { id },
            include: {
                cliente: true
            }
        })
        return { data: proyecto }
    } catch (error) {
        console.error("Failed to fetch proyecto:", error)
        return { error: "Error al cargar el proyecto." }
    }
}

export async function updateProyecto(id: string, formData: FormData) {
    const nombre = formData.get("nombre") as string
    // const area = parseFloat(formData.get("areaHa") as string)
    const observaciones = formData.get("observaciones") as string

    if (!nombre) {
        return { error: "Campos obligatorios faltantes." }
    }

    try {
        await db.proyecto.update({
            where: { id },
            data: {
                nombre,
                observaciones,
            }
        })
    } catch (error) {
        console.error("Failed to update proyecto:", error)
        return { error: "Error al actualizar el proyecto." }
    }

    revalidatePath('/proyectos')
    revalidatePath(`/proyectos/${id}/edit`)
    return { success: true }
}
