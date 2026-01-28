import { notFound } from "next/navigation"
import { getClienteById } from "@/services/clientes"
import { EditClienteForm } from "@/components/clientes/EditClienteForm"

export default async function EditClientePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const cliente = await getClienteById(id)

    if (!cliente) {
        notFound()
    }

    return <EditClienteForm cliente={cliente} />
}
