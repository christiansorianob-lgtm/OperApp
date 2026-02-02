const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAllTasks() {
    console.log("Starting full task cleanup...");

    try {
        // Delete dependent records first to avoid foreign key constraints
        // 1. Trazabilidad
        const deletedTrazabilidad = await prisma.trazabilidad.deleteMany({});
        console.log(`Deleted ${deletedTrazabilidad.count} trace records.`);

        // 2. UsoMaquinaria
        const deletedUsoMaquinaria = await prisma.usoMaquinaria.deleteMany({});
        console.log(`Deleted ${deletedUsoMaquinaria.count} machinery usage records.`);

        // 3. MovimientoInventario (Only those linked to tasks?)
        // If we want to clear ALL tasks, we should probably clear movements linked to them.
        // The schema shows MovimientoInventario has an optional relation to Tarea.
        // We will delete movements where tareaId is NOT null.
        const deletedMovimientos = await prisma.movimientoInventario.deleteMany({
            where: {
                tareaId: {
                    not: null
                }
            }
        });
        console.log(`Deleted ${deletedMovimientos.count} inventory movements linked to tasks.`);

        // 4. Evidencia
        const deletedEvidencia = await prisma.evidencia.deleteMany({});
        console.log(`Deleted ${deletedEvidencia.count} evidence records.`);

        // 5. DetalleFotografico
        const deletedFotos = await prisma.detalleFotografico.deleteMany({});
        console.log(`Deleted ${deletedFotos.count} photographic report records.`);

        // 6. Finally, delete all Tasks
        const deletedTasks = await prisma.tarea.deleteMany({});
        console.log(`Deleted ${deletedTasks.count} tasks.`);

        console.log("All tasks and related data cleared successfully.");

    } catch (error) {
        console.error("Error during cleanup:", error);
    } finally {
        await prisma.$disconnect();
    }
}

clearAllTasks();
