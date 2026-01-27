'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getUsuarios() {
    try {
        const usuarios = await db.usuario.findMany({
            orderBy: { nombre: 'asc' },
            include: {
                cliente: true // Include info if linked to client
            }
        })
        return { data: usuarios }
    } catch (error) {
        console.error("Error fetching usuarios:", error)
        return { error: "Error al cargar usuarios" }
    }
}

export async function getUsuarioById(id: string) {
    try {
        const usuario = await db.usuario.findUnique({
            where: { id },
            include: {
                cliente: true
            }
        })
        return { data: usuario }
    } catch (error) {
        return { error: "Error al cargar usuario" }
    }
}

export async function createUsuario(formData: FormData) {
    const nombre = formData.get("nombre") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const perfil = formData.get("perfil") as "ADMINISTRADOR" | "CLIENTE"
    const clienteId = formData.get("clienteId") as string

    if (!nombre || !email || !password || !perfil) {
        return { error: "Faltan campos obligatorios" }
    }

    try {
        await db.usuario.create({
            data: {
                nombre,
                email,
                password, // NOTE: Use hashing in production!
                perfil,
                clienteId: perfil === "CLIENTE" && clienteId ? clienteId : null,
                activo: true
            }
        })
    } catch (error: any) {
        console.error("Create User Error", error)
        if (error.code === 'P2002') return { error: "El email ya está registrado" }
        return { error: "Error al crear usuario" }
    }

    revalidatePath("/configuracion/usuarios")
    redirect("/configuracion/usuarios") // Using redirect in server action
}

export async function updateUsuario(id: string, formData: FormData) {
    const nombre = formData.get("nombre") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const perfil = formData.get("perfil") as "ADMINISTRADOR" | "CLIENTE"
    const clienteId = formData.get("clienteId") as string
    const activo = formData.get("activo") === "true"

    if (!nombre || !email || !perfil) {
        return { error: "Faltan campos obligatorios" }
    }

    try {
        const data: any = {
            nombre,
            email,
            perfil,
            clienteId: perfil === "CLIENTE" && clienteId ? clienteId : null,
            activo
        }

        // Update password only if provided
        if (password && password.trim() !== "") {
            data.password = password
        }

        await db.usuario.update({
            where: { id },
            data
        })
    } catch (error: any) {
        if (error.code === 'P2002') return { error: "El email ya está registrado por otro usuario" }
        return { error: "Error al actualizar usuario" }
    }

    revalidatePath("/configuracion/usuarios")
    redirect("/configuracion/usuarios")
}

export async function deleteUsuario(id: string) {
    try {
        await db.usuario.delete({ where: { id } })
        revalidatePath("/configuracion/usuarios")
        return { success: true }
    } catch (error) {
        return { error: "No se puede eliminar el usuario" }
    }
}
