import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// POST: Agregar un nuevo registro fotográfico (Antes/Después)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { fotoAntes, fotoDespues, comentario } = body

        if (!id || !fotoAntes || !fotoDespues) {
            return NextResponse.json({ error: "Faltan datos (Tarea ID, Foto Antes o Foto Después)" }, { status: 400 })
        }

        const nuevoDetalle = await db.detalleFotografico.create({
            data: {
                tareaId: id,
                fotoAntes, // Base64
                fotoDespues, // Base64
                comentario: comentario || ""
            }
        })

        return NextResponse.json({ success: true, data: nuevoDetalle })

    } catch (error: any) {
        console.error("Error creating photographic report detail:", error)
        // Log keys to identify if model is missing
        if (db && !db.detalleFotografico) {
            console.error("CRITICAL: db.detalleFotografico is undefined. Server restart required.")
        }
        return NextResponse.json({
            error: "Error interno del servidor",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}

// GET: Obtener todos los registros fotográficos de una tarea
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const detalles = await db.detalleFotografico.findMany({
            where: { tareaId: id },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(detalles)

    } catch (error) {
        console.error("Error fetching photographic report details:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}
