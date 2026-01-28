
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking Prisma Client...')
    if ('detalleFotografico' in prisma) {
        console.log('SUCCESS: detalleFotografico model exists in Prisma Client.')
    } else {
        console.log('FAILURE: detalleFotografico model MISSING in Prisma Client.')
        console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')))
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
