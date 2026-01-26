
import { NextResponse } from 'next/server';
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return NextResponse.json({})
}

export async function GET() {
    return NextResponse.json({ message: "Login API is working. Send POST request to login." }, { status: 200 });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phone, password } = body;

        console.log(`[Login Route] Attempt for phone: ${phone}`);

        if (!phone || !password) {
            return NextResponse.json(
                { error: "Celular y contraseña requeridos" },
                { status: 400 }
            );
        }

        // Search for user
        const responsable = await db.responsable.findFirst({
            where: {
                celular: { equals: phone.trim() },
                password: { equals: password.trim() },
                activo: true
            },
            include: { cargoRef: true }
        });

        if (!responsable) {
            return NextResponse.json(
                { error: "Credenciales incorrectas (Celular o contraseña)" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: responsable.id,
                nombre: responsable.nombre,
                cargo: responsable.cargoRef?.nombre || "Sin Cargo",
                celular: responsable.celular
            }
        }, {
            status: 200
        });

    } catch (error) {
        console.error("Login Route Error:", error);
        return NextResponse.json(
            { error: "Error procesando la solicitud" },
            { status: 500 }
        );
    }
}
