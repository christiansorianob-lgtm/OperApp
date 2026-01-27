const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteCarpinteriaTask() {
    console.log("Searching for task 'Carpintería'...");

    const tasks = await prisma.tarea.findMany({
        where: {
            tipo: "Carpintería"
        }
    });

    console.log(`Found ${tasks.length} tasks.`);

    if (tasks.length > 0) {
        for (const task of tasks) {
            console.log(`Deleting task ID: ${task.id} | Desc: ${task.descripcion}`);
            try {
                // Delete related records first if any (Cascading might handle it, but being safe)
                await prisma.trazabilidad.deleteMany({ where: { tareaId: task.id } });
                await prisma.usoMaquinaria.deleteMany({ where: { tareaId: task.id } });
                await prisma.movimientoInventario.deleteMany({ where: { tareaId: task.id } });

                // Delete the task
                await prisma.tarea.delete({
                    where: { id: task.id }
                });
                console.log("Deleted successfully.");
            } catch (error) {
                console.error(`Failed to delete task ${task.id}:`, error);
            }
        }
    } else {
        console.log("No task found to delete.");
    }
}

deleteCarpinteriaTask()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
