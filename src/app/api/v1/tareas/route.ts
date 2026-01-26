import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
    'Access-Control-Max-Age': '86400',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const responsableId = searchParams.get('responsableId')

    if (!responsableId) {
        return NextResponse.json(
            { error: "Responsable ID required" },
            { status: 400, headers: corsHeaders }
        )
    }

    try {
        // 1. Find the Responsible Name from ID
        const responsable = await db.responsable.findUnique({
            where: { id: responsableId }
        })

        if (!responsable) {
            return NextResponse.json(
                { error: "Responsable not found" },
                { status: 404, headers: corsHeaders }
            )
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

        return NextResponse.json({ data: tareas }, { status: 200, headers: corsHeaders })
    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500, headers: corsHeaders }
        )
    }
}
