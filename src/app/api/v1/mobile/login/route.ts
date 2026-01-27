
import { NextResponse } from 'next/server';
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("Login API GET Check");
    return NextResponse.json({ message: "New Login API (public/login) is READY (DB Disabled)." }, { status: 200 });
}



export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phone, password } = body;

        console.log(`[Mobile Login] Attempt for phone: ${phone}`);

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
            console.warn(`[Mobile Login] Failed login for ${phone}`);
            return NextResponse.json(
                { error: "Credenciales incorrectas o usuario inactivo" },
                { status: 401 }
            );
        }

        console.log(`[Mobile Login] Success: ${responsable.nombre}`);

        return NextResponse.json({
            success: true,
            user: {
                id: responsable.id,
                nombre: responsable.nombre,
                cargo: responsable.cargoRef?.nombre || "Sin Cargo",
                celular: responsable.celular
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Login Route Error:", error);
        return NextResponse.json(
            { error: "Error procesando la solicitud" },
            { status: 500 }
        );
    }
}

