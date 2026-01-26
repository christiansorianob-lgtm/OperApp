import { NextResponse } from 'next/server';
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const userCount = await db.usuario.count();
        const responsableCount = await db.responsable.count();
        return NextResponse.json({
            status: "OK",
            users: userCount,
            responsables: responsableCount,
            message: "Database connection successful"
        }, { status: 200 });
    } catch (error: any) {
        console.error("DB Test Error:", error);
        return NextResponse.json({
            status: "ERROR",
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
