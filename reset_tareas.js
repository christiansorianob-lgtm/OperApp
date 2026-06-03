const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("Iniciando borrado de datos de prueba...")

    // El orden es importante para no violar las llaves foráneas (Foreign Keys)
    
    // 1. Borrar reportes fotográficos y evidencias
    const deletedDetalles = await prisma.detalleFotografico.deleteMany()
    console.log(`Borrados ${deletedDetalles.count} Detalles Fotográficos`)

    const deletedEvidencias = await prisma.evidencia.deleteMany()
    console.log(`Borradas ${deletedEvidencias.count} Evidencias (Base64 antiguas)`)

    // 2. Borrar Trazabilidad (GPS)
    const deletedTrazabilidad = await prisma.trazabilidad.deleteMany()
    console.log(`Borrados ${deletedTrazabilidad.count} registros de Trazabilidad`)

    // 3. Borrar Usos de Maquinaria
    const deletedUsos = await prisma.usoMaquinaria.deleteMany()
    console.log(`Borrados ${deletedUsos.count} usos de maquinaria`)

    // 4. Borrar Movimientos de Inventario asociados a Tareas
    // Ojo: Esto no recalcula el stock de los productos. Si quieres resetear el stock, dímelo.
    const deletedMovimientos = await prisma.movimientoInventario.deleteMany({
        where: {
            tareaId: {
                not: null
            }
        }
    })
    console.log(`Borrados ${deletedMovimientos.count} movimientos de inventario por consumo en tareas`)

    // 5. Finalmente, borrar las tareas
    const deletedTareas = await prisma.tarea.deleteMany()
    console.log(`Borradas ${deletedTareas.count} Tareas`)

    console.log("Limpieza completada exitosamente.")
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
