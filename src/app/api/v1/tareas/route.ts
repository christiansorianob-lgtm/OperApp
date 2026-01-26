import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const responsableId = searchParams.get('responsableId')

    if (!responsableId) {
        return NextResponse.json(
            { error: "Responsable ID required" },
            { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
        )
    }

    try {
        // 1. Find the Responsible Name from ID
        const responsable = await db.responsable.findUnique({
            where: { id: responsableId }
        })

        if (!responsable) {
            return NextResponse.json({ error: "Responsable not found" }, { status: 404 })
        }

        // 2. Find tasks assigned to this name
        const tareas = await db.tarea.findMany({
            where: {
                responsable: responsable.nombre,
                estado: { not: 'CANCELADA' }
            },
            orderBy: { fechaProgramada: 'asc' },
            include: {
                proyecto: true
            }
        })

        return NextResponse.json({ data: tareas })
    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
