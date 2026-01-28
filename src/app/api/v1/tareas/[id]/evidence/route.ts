import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!id || !file) {
            return NextResponse.json({ error: "Missing task ID or file" }, { status: 400 })
        }

        // 1. Convert File to Base64
        const buffer = Buffer.from(await file.arrayBuffer())
        const base64Data = buffer.toString('base64')
        const mimeType = file.type || 'image/jpeg'

        // 2. Save to DB (Evidencia Table)
        const evidence = await db.evidencia.create({
            data: {
                tipo: mimeType,
                datos: base64Data,
                tareaId: id
            }
        })

        // 3. Generate "Virtual" URL
        // compatible with existing logic that expects a URL string in the Tarea.evidencias field
        const virtualUrl = `/api/v1/evidence/${evidence.id}`

        // 4. Append URL to Tarea.evidencias
        const currentTask = await db.tarea.findUnique({
            where: { id },
            select: { evidencias: true }
        })

        if (!currentTask) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 })
        }

        const currentEvidence = currentTask.evidencias || ""
        const newEvidence = currentEvidence ? `${currentEvidence}\n${virtualUrl}` : virtualUrl

        await db.tarea.update({
            where: { id },
            data: { evidencias: newEvidence }
        })

        return NextResponse.json({ success: true, url: virtualUrl })

    } catch (error) {
        console.error("Upload Error:", error)
        return NextResponse.json({ error: "Error uploading file" }, { status: 500 })
    }
}
