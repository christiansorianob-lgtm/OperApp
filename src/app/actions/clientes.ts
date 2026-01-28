'use server'

import { createClienteInDb, findLastCliente, getAllClientes, updateClienteInDb } from "@/services/clientes"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getClientes() {
    try {
        const clientes = await getAllClientes()
        return { data: clientes }
    } catch (error) {
        console.error("Failed to fetch clientes:", error)
        return { error: "Error al cargar los clientes." }
    }
}

export async function createCliente(formData: FormData) {
    const nombre = formData.get("nombre") as string
    const direccion = formData.get("direccion") as string
    const responsable = formData.get("responsable") as string
    const telefono = formData.get("telefono") as string
    const nit = formData.get("nit") as string
    const email = formData.get("email") as string
    const observaciones = formData.get("observaciones") as string

    if (!nombre) {
        return { error: "El nombre es obligatorio." }
    }

    try {
        // Auto-generate code
        const lastCliente = await findLastCliente()

        let nextCode = "CLI-001"
        if (lastCliente && lastCliente.codigo.startsWith("CLI-")) {
            const lastNumber = parseInt(lastCliente.codigo.split("-")[1])
            if (!isNaN(lastNumber)) {
                nextCode = `CLI-${(lastNumber + 1).toString().padStart(3, '0')}`
            }
        }

        await createClienteInDb({
            codigo: nextCode,
            nombre,
            direccion,
            responsable,
            telefono,
            nit,
            email,
            observaciones,
            estado: 'ACTIVO'
        })

    } catch (error: any) {
        console.error("Failed to create cliente:", error)
        return { error: `Error: ${error.message}` }
    }

    revalidatePath('/clientes')
    // redirect('/clientes') // Let client handle redirect to avoid NEXT_REDIRECT issues in try-catch
    return { success: true }
}

export async function updateCliente(id: string, formData: FormData) {
    const nombre = formData.get("nombre") as string
    const direccion = formData.get("direccion") as string
    const responsable = formData.get("responsable") as string
    const telefono = formData.get("telefono") as string
    const nit = formData.get("nit") as string
    const email = formData.get("email") as string
    const observaciones = formData.get("observaciones") as string

    if (!nombre) {
        return { error: "El nombre es obligatorio." }
    }

    try {
        await updateClienteInDb(id, {
            nombre,
            direccion,
            responsable,
            telefono,
            nit,
            email,
            observaciones
        })

    } catch (error: any) {
        console.error("Failed to update cliente:", error)
        return { error: `Error: ${error.message}` }
    }

    revalidatePath('/clientes')
    revalidatePath(`/clientes/${id}`)
    return { success: true }
}
