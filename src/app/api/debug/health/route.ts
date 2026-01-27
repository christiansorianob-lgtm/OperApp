import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("[Health Check] API is reachable");
    return NextResponse.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        message: "API is working correctly on Vercel"
    }, { status: 200 });
}
