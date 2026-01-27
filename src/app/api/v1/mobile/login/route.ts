
import { NextResponse } from 'next/server';
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("Login API GET Check");
    return NextResponse.json({ message: "New Login API (public/login) is READY (DB Disabled)." }, { status: 200 });
}

// Helper for CORS Headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phone, password } = body;

        console.log(`[Public Login] Attempt for phone: ${phone}`);

        if (!phone || !password) {
            return NextResponse.json(
                { error: "Celular y contraseña requeridos" },
                { status: 400, headers: corsHeaders }
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
                { status: 401, headers: corsHeaders }
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
            status: 200,
            headers: corsHeaders
        });

    } catch (error) {
        console.error("Login Route Error:", error);
        return NextResponse.json(
            { error: "Error procesando la solicitud" },
            { status: 500, headers: corsHeaders }
        );
    }
}
