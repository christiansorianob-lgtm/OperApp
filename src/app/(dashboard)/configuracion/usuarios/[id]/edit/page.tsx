import { getUsuarioById } from "@/app/actions/usuarios"
import { getClientes } from "@/app/actions/clientes"
import { BackButton } from "@/components/common/BackButton"
import { UsuarioForm } from "@/components/forms/UsuarioForm"
import { notFound } from "next/navigation"

export default async function EditUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data: usuario } = await getUsuarioById(id)
    const { data: clientes } = await getClientes()

    if (!usuario) {
        notFound()
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <BackButton fallback="/configuracion/usuarios" />
                <h1 className="text-2xl font-bold">Editar Usuario</h1>
            </div>

            <UsuarioForm clientes={clientes || []} usuario={usuario} />
        </div>
    )
}
