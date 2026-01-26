import { NextResponse } from 'next/server';
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        message: "Test DB Endpoint is working",
        timestamp: new Date().toISOString()
    }, { status: 200 });
}
