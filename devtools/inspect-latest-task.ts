
import { db } from '../src/lib/db';

async function main() {
    const lastTask = await db.tarea.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
            reportesFotograficos: true,
            evidenciasDb: true // Check the dedicated table
        }
    });

    if (!lastTask) {
        console.log("No tasks found.");
        return;
    }

    console.log("=== LATEST TASK ===");
    console.log(`ID: ${lastTask.id}`);
    console.log(`Codigo: ${lastTask.codigo}`);
    console.log(`Tipo: ${lastTask.tipo}`);
    console.log(`Evidencias String Field: ${JSON.stringify(lastTask.evidencias)}`);

    console.log("\n--- Reportes Fotograficos (DetalleFotografico Table) ---");
    lastTask.reportesFotograficos.forEach((r, i) => {
        console.log(`#${i + 1} ID: ${r.id} | Creado: ${r.createdAt.toISOString()} | Comentario: ${r.comentario}`);
        console.log(`   FotoAntes (Len): ${r.fotoAntes?.length}`);
        console.log(`   FotoDespues (Len): ${r.fotoDespues?.length}`);
    });

    console.log("\n--- Evidencias (Evidencia Table) ---");
    // Manual fetch if relation name is wrong, but schema said evidenciasDb
    const evidencias = await db.evidencia.findMany({
        where: { tareaId: lastTask.id }
    });

    evidencias.forEach((e, i) => {
        console.log(`#${i + 1} ID: ${e.id} | Tipo: ${e.tipo} | Size: ${e.datos.length}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await db.$disconnect();
    });
