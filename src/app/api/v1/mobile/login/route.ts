
import { NextResponse } from 'next/server';
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({ message: "New Login API (public/login) is READY (DB Disabled)." }, { status: 200 });
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return NextResponse.json({})
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phone, password } = body;

        console.log(`[Public Login] Attempt for phone: ${phone}`);

        if (!phone || !password) {
            return NextResponse.json(
                { error: "Celular y contraseña requeridos" },
                { status: 400 }
            );
        }

        // DB CHECK TEMPORARILY DISABLED
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
                { error: "Credenciales incorrectas" },
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
