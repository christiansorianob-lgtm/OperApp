import { NextResponse } from "next/server";
import { createProyectoInDb, findLastProyecto } from "@/services/proyectos";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            clienteId,
            codigo,
            nombre,
            observaciones
        } = body;

        // Validation
        if (!clienteId || !nombre) {
            return NextResponse.json({ error: "Faltan campos obligatorios (Cliente, Nombre)" }, { status: 400 });
        }

        // Auto-generate code if missing
        let useCode = codigo;
        if (!useCode) {
            const last = await findLastProyecto(clienteId);
            let nextNum = 1;
            if (last && last.codigo.startsWith("PRJ-")) {
                const part = last.codigo.split("-")[1];
                if (part && !isNaN(parseInt(part))) nextNum = parseInt(part) + 1;
            }
            useCode = `PRJ-${nextNum.toString().padStart(3, '0')}`;
        }

        const newProyecto = await createProyectoInDb({
            clienteId,
            codigo: useCode,
            nombre,
            observaciones,
            estado: 'EN_EJECUCION'
        });

        return NextResponse.json({ data: newProyecto });

    } catch (error: any) {
        console.error("API Error creating proyecto:", error);

        // Handle Prisma unique constraint errors if any
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "El código del proyecto ya existe." }, { status: 400 });
        }

        return NextResponse.json(
            { error: `Error interno: ${error.message}` },
            { status: 500 }
        );
    }
}
