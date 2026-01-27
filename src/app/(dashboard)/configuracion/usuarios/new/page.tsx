import { getClientes } from "@/app/actions/clientes"
import { BackButton } from "@/components/common/BackButton"
import { UsuarioForm } from "@/components/forms/UsuarioForm"

export default async function NewUsuarioPage() {
    const { data: clientes } = await getClientes()

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <BackButton fallback="/configuracion/usuarios" />
                <h1 className="text-2xl font-bold">Nuevo Usuario</h1>
            </div>

            <UsuarioForm clientes={clientes || []} />
        </div>
    )
}
