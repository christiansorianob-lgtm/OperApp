import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const obraId = searchParams.get("obraId")

        const whereClause: any = {
            activo: true,
            stockActual: { gt: 0 } // Only show products with stock
        }

        if (obraId) {
            whereClause.obraId = obraId
        }

        const productos = await db.producto.findMany({
            where: whereClause,
            select: {
                id: true,
                nombre: true,
                unidadMedida: true,
                stockActual: true,
                codigo: true
            },
            orderBy: { nombre: 'asc' }
        })

        return NextResponse.json(productos)
    } catch (error) {
        console.error("Error fetching productos:", error)
        return NextResponse.json({ error: "Error al cargar productos" }, { status: 500 })
    }
}
