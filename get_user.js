const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const user = await prisma.usuario.findUnique({
        where: { email: "christiansorianob@gmail.com" }
    })
    console.log(user)
}
main().finally(() => prisma.$disconnect())
