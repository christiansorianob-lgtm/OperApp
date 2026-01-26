import { PrismaClient } from "@prisma/client"

export async function createProyectoInDb(data: any) {
    const prisma = new PrismaClient()
    try {
        return await prisma.proyecto.create({
            data
        })
    } finally {
        await prisma.$disconnect()
    }
}

export async function findLastProyecto(clienteId: string) {
    const prisma = new PrismaClient()
    try {
        return await prisma.proyecto.findFirst({
            where: { clienteId },
            orderBy: { createdAt: 'desc' }
        })
    } finally {
        await prisma.$disconnect()
    }
}

export async function getProyectosByCliente(clienteId: string) {
    const prisma = new PrismaClient()
    try {
        return await prisma.proyecto.findMany({
            where: { clienteId },
            orderBy: { createdAt: 'desc' },
            include: { cliente: true }
        })
    } finally {
        await prisma.$disconnect()
    }
}
