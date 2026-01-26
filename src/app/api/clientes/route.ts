import { NextResponse } from "next/server";
import { createClienteInDb, findLastCliente } from "@/services/clientes";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            nombre,
            direccion,
            responsable,
            telefono,
            nit,
            email,
            observaciones
        } = body;

        // Validation
        if (!nombre || !responsable) {
            return NextResponse.json({ error: "Campos obligatorios faltantes (Nombre, Responsable)" }, { status: 400 });
        }

        // Auto-generate code
        const last = await findLastCliente();

        let nextCode = "CLI-001";
        if (last && last.codigo.startsWith("CLI-")) {
            const lastNumber = parseInt(last.codigo.split("-")[1]);
            if (!isNaN(lastNumber)) {
                nextCode = `CLI-${(lastNumber + 1).toString().padStart(3, '0')}`;
            }
        }

        const newCliente = await createClienteInDb({
            codigo: nextCode,
            nombre,
            direccion,
            responsable,
            telefono,
            nit,
            email,
            observaciones,
            estado: 'ACTIVO'
        });

        return NextResponse.json({ data: newCliente });

    } catch (error: any) {
        console.error("API Error creating cliente:", error);
        return NextResponse.json(
            { error: `Error interno: ${error.message}` },
            { status: 500 }
        );
    }
}
