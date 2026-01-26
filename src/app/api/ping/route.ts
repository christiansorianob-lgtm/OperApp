import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({ message: "pong" });
}

export async function OPTIONS() {
    return NextResponse.json({})
}
