import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

// Función auxiliar para subir Base64 a Vercel Blob
async function uploadBase64(base64Str: string, prefix: string) {
    let base64Data = base64Str
    let contentType = 'image/jpeg' // Default
    
    if (base64Str.startsWith('data:')) {
        const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/)
        if (matches && matches.length === 3) {
            contentType = matches[1]
            base64Data = matches[2]
        }
    }
    
    const buffer = Buffer.from(base64Data, 'base64')
    const filename = `${prefix}-${Date.now()}.jpg`
    
    const blob = await put(`tareas/${filename}`, buffer, { 
        access: 'public', 
        contentType: contentType 
    })
    return blob.url
}

// POST: Agregar un nuevo registro fotográfico (Antes/Después)
export const dynamic = 'force-dynamic'
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

        // Subir a Vercel Blob
        const fotoAntesUrl = await uploadBase64(fotoAntes, 'antes')
        const fotoDespuesUrl = await uploadBase64(fotoDespues, 'despues')

        const nuevoDetalle = await db.detalleFotografico.create({
            data: {
                tareaId: id,
                fotoAntes: fotoAntesUrl,
                fotoDespues: fotoDespuesUrl,
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
