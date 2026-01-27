import { NextResponse } from 'next/server';
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

export async function GET() {
    return NextResponse.json({ message: "Hello API (now acting as Login) is working" }, { status: 200 });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, password } = body;

        if (!phone || !password) {
            return NextResponse.json({ error: "Credenciales requeridas" }, { status: 400 });
        }

        const responsable = await db.responsable.findFirst({
            where: {
                celular: { equals: phone.trim() },
                password: { equals: password.trim() },
                activo: true
            },
            include: { cargoRef: true }
        });

        if (!responsable) {
            return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
        }

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
        console.error("Login Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
