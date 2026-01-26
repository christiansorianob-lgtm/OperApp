import { NextResponse } from 'next/server';
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    return NextResponse.json({});
}

export async function GET() {
    return NextResponse.json({ message: "Login API is active" }, { status: 200 });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, password } = body;

        if (!phone || !password) {
            return NextResponse.json(
                { error: "Telefono y contraseña requeridos" },
                { status: 400 }
            );
        }

        const responsable = await db.responsable.findFirst({
            where: {
                celular: { equals: phone.trim() },
                password: { equals: password.trim() },
                activo: true
            },
            include: {
                cargo: true
            }
        });

        if (!responsable) {
            return NextResponse.json(
                { error: "Credenciales inválidas o usuario inactivo" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: responsable.id,
                nombre: responsable.nombre,
                cargo: responsable.cargo?.nombre || "Sin Cargo",
                celular: responsable.celular
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Login API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
