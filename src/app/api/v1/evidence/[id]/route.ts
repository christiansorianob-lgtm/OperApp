import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const evidence = await db.evidencia.findUnique({
            where: { id }
        })

        if (!evidence) {
            return NextResponse.json({ error: "Image not found" }, { status: 404 })
        }

        // Convert Base64 string back to Buffer
        const imageBuffer = Buffer.from(evidence.datos, 'base64')

        // Return image response
        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': evidence.tipo,
                'Content-Length': imageBuffer.length.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        })

    } catch (error) {
        console.error("Evidence Fetch Error:", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
