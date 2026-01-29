import { getAdminSession } from "@/app/actions/auth"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { PortalTaskDetailView } from "@/components/portal/PortalTaskDetailView"

export const dynamic = 'force-dynamic'

interface Props {
    params: Promise<{ id: string }>
}

export default async function TaskDetailPage(props: Props) {
    const params = await props.params;
    const session = await getAdminSession()

    if (!session || session.role !== 'CLIENTE') {
        redirect("/login")
    }

    const tarea = await db.tarea.findUnique({
        where: { id: params.id },
        include: {
            proyecto: true,
            trazabilidad: {
                orderBy: { timestamp: 'asc' }
            },
            reportesFotograficos: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    // Security Check: Ensure task belongs to a project of this client
    if (!tarea || !tarea.proyecto || tarea.proyecto.clienteId !== session.clienteId) {
        return notFound()
    }

    return <PortalTaskDetailView tarea={tarea} />
}
