'use server'

import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const ADMIN_COOKIE_NAME = "operapp_admin_session"

export async function loginAdmin(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
        return { error: "Por favor ingrese correo y contraseña." }
    }

    try {
        // Find user by email in Usuario table
        const user = await db.usuario.findUnique({
            where: {
                email: email
            }
        })

        if (!user || !user.activo) {
            return { error: "Usuario no encontrado o inactivo." }
        }

        // Verify password
        if (user.password !== password) {
            return { error: "Contraseña incorrecta." }
        }

        // Create Session
        const sessionData = JSON.stringify({
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            role: user.perfil, // ADMINISTRADOR or CLIENTE
            clienteId: user.clienteId // Null for admins, set for clients
        })

        const cookieStore = await cookies()
        cookieStore.set(ADMIN_COOKIE_NAME, sessionData, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/'
        })

        return { success: true, role: user.perfil }

    } catch (error) {
        console.error("Login Admin Error:", error)
        return { error: "Error interno del servidor." }
    }
}

export async function logoutAdmin() {
    const cookieStore = await cookies()
    cookieStore.delete(ADMIN_COOKIE_NAME)
    redirect("/login")
}

export async function getAdminSession() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)

    if (!sessionCookie) return null

    try {
        return JSON.parse(sessionCookie.value)
    } catch (e) {
        return null
    }
}

export async function updateProfile(formData: FormData) {
    const id = formData.get("id") as string
    const celular = formData.get("celular") as string
    const password = formData.get("password") as string

    if (!id) return { error: "ID de usuario requerido" }

    try {
        const dataToUpdate: any = { celular }
        if (password && password.trim() !== "") {
            dataToUpdate.password = password
        }

        await db.responsable.update({
            where: { id },
            data: dataToUpdate
        })

        // We should probably update the session cookie if critical info changed, but 
        // for cell/password update, the session (id/email/role) remains valid.
        // Revalidating paths might be enough.

        return { success: true }
    } catch (e) {
        console.error("Update Profile Error:", e)
        return { error: "Error al actualizar perfil" }
    }
}
