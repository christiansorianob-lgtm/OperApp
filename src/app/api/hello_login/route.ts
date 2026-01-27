import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ message: "Hello Login Check" }, { status: 200 });
}

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

// Minimal POST to test connectivity
export async function POST(req) {
    return NextResponse.json({ success: true, message: "Login POST Reached" }, { status: 200 });
}
