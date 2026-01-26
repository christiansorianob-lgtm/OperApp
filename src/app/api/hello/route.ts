
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ message: "Hello from OperApp API!" }, { status: 200 });
}
