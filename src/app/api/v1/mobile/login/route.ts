
import { NextResponse } from 'next/server';
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("Login API GET Check");
    return NextResponse.json({ message: "New Login API (public/login) is READY (DB Disabled)." }, { status: 200 });
}



export async function POST(req: Request) {
    try {
        console.log("Login API POST Check");
        return NextResponse.json({
            success: true,
            message: "Login API is REACHABLE",
            user: {
                id: "test-id",
                nombre: "Usuario de Prueba",
                cargo: "Operador",
                celular: "3000000000"
            }
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Error testing route" }, { status: 500 });
    }
}

