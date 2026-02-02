
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const lastTask = await db.tarea.findFirst({
            orderBy: { createdAt: 'desc' },
            include: {
                reportesFotograficos: true,
                evidenciasDb: true
            }
        });

        if (!lastTask) {
            return NextResponse.json({ found: false });
        }

        return NextResponse.json({
            found: true,
            id: lastTask.id,
            codigo: lastTask.codigo,
            evidenciasString: lastTask.evidencias,
            reportes: lastTask.reportesFotograficos.map(r => ({
                id: r.id,
                comentario: r.comentario,
                hasAntes: !!r.fotoAntes,
                hasDespues: !!r.fotoDespues,
                createdAt: r.createdAt
            })),
            evidenciasDb: lastTask.evidenciasDb.map(e => ({
                id: e.id,
                tipo: e.tipo,
                size: e.datos?.length,
                createdAt: e.createdAt // Assuming created at exists, or map ID
            }))
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
