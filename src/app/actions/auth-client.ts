'use server'

import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const COOKIE_NAME = "operapp_client_session"

export async function loginClient(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
        return { error: "Por favor complete todos los campos." }
    }

    try {
        const cliente = await db.cliente.findFirst({
            where: {
                email: email,
                password: password, // In production, verify hash
                portalAccess: true
            }
        })

        if (!cliente) {
            return { error: "Credenciales inválidas o acceso no habilitado." }
        }

        // Set simple session cookie (In prod use JWT)
        // Store just the ID for simplicity in this demo
        const sessionData = JSON.stringify({ id: cliente.id, nombre: cliente.nombre, email: cliente.email })

        const cookieStore = await cookies()
        cookieStore.set(COOKIE_NAME, sessionData, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/'
        })

        return { success: true }
    } catch (error) {
        console.error("Login error:", error)
        return { error: "Error en el servidor al intentar ingresar." }
    }
}

export async function logoutClient() {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
    redirect("/portal/login")
}

export async function getClientSession() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(COOKIE_NAME)

    if (!sessionCookie) return null

    try {
        return JSON.parse(sessionCookie.value)
    } catch (e) {
        return null
    }
}
