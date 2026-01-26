
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const code = 'CLI-002'
    try {
        const deleted = await prisma.cliente.delete({
            where: { codigo: code }
        })
        console.log(`Deleted client: ${deleted.nombre} (${deleted.codigo})`)
    } catch (e) {
        console.log('Client not found or already deleted.', e)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
