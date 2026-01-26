import { db } from "@/lib/db"

export async function createClienteInDb(data: any) {
    return await db.cliente.create({
        data
    })
}

export async function findLastCliente() {
    return await db.cliente.findFirst({
        orderBy: { createdAt: 'desc' }
    })
}

export async function getAllClientes() {
    return await db.cliente.findMany({
        orderBy: { createdAt: 'desc' },
        include: { proyectos: true }
    })
}

export async function getClienteById(id: string) {
    return await db.cliente.findUnique({
        where: { id },
        include: { proyectos: true }
    })
}
