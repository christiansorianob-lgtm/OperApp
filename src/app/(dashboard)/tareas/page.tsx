import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getTareas } from "@/app/actions/tareas"
import { Plus } from "lucide-react"
import { BackButton } from "@/components/common/BackButton"

export default async function TareasPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams
    // Map URL params legacy -> new
    const clienteId = (searchParams.clienteId || searchParams.obraId) as string | undefined
    const proyectoId = (searchParams.proyectoId || searchParams.frenteId) as string | undefined
    const filterNivel = searchParams.filter as string | undefined // 'cliente_only'
    const statusParam = searchParams.status as string | undefined
    const delayedParam = searchParams.delayed as string | undefined

    // Determine filters for Server Action
    const filters: any = {}
    if (clienteId) filters.obraId = clienteId // getTareas still accepts obraId/frenteId keys in its argument signature? 
    // Wait, getTareas signature in Step 625:
    // export async function getTareas(filters?: { obraId?: string, frenteId?: string ... })
    // So yes, I must pass obraId/frenteId keys to getTareas, but values are clienteId.
    if (proyectoId) filters.frenteId = proyectoId

    // Logic for Nivel filter
    if (filterNivel === 'cliente_only') filters.nivel = 'CLIENTE'

    if (statusParam) {
        filters.estado = statusParam.split(',')
    }

    if (delayedParam === 'true') {
        filters.delayed = true
    }

    const { data: tareas, error } = await getTareas(filters)

    // Construct query string for new task
    const newParams = new URLSearchParams()
    if (clienteId) newParams.set('clienteId', clienteId)
    if (proyectoId) newParams.set('proyectoId', proyectoId)
    const newHref = `/tareas/new?${newParams.toString()}`

    // Construct toggle filter link (Client Context)
    const toggleFilterParams = new URLSearchParams(newParams)
    // Restore existing other params? Simplified here.
    if (clienteId) toggleFilterParams.set('clienteId', clienteId)
    if (proyectoId) toggleFilterParams.set('proyectoId', proyectoId) // Although usually if proyectoId is set, we see project tasks.

    if (filterNivel === 'cliente_only') {
        toggleFilterParams.delete('filter')
    } else {
        toggleFilterParams.set('filter', 'cliente_only')
    }
    const toggleFilterHref = `/tareas?${toggleFilterParams.toString()}`

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <BackButton fallback="/" />
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-primary">Tareas</h2>
                        <div className="text-muted-foreground flex items-center gap-2">
                            <p>Programación y ejecución de actividades</p>
                            {proyectoId && <span className="text-xs bg-muted px-2 py-1 rounded">Filtrado por Proyecto</span>}
                            {clienteId && !proyectoId && <span className="text-xs bg-muted px-2 py-1 rounded">Contexto Cliente</span>}
                            {statusParam && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Estado: {statusParam.replace(',', ', ')}</span>}
                            {delayedParam === 'true' && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Atrasadas</span>}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Toggle Button for Client Context */}
                    {clienteId && !proyectoId && (
                        <Button variant={filterNivel === 'cliente_only' ? "secondary" : "outline"} asChild>
                            <Link href={toggleFilterHref}>
                                {filterNivel === 'cliente_only' ? "Ver Todas" : "Solo Nivel Cliente"}
                            </Link>
                        </Button>
                    )}

                    <Button asChild>
                        <Link href={newHref}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Tarea
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {proyectoId ? "Tareas del Proyecto" :
                            clienteId ? (filterNivel === 'cliente_only' ? "Tareas Generales del Cliente" : "Todas las Tareas del Cliente") :
                                "Listado General de Tareas"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {error && <p className="text-destructive mb-4">{error}</p>}

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Tarea</TableHead>
                                <TableHead>Cliente / Proyecto</TableHead>
                                <TableHead>Nivel</TableHead>
                                <TableHead>Responsable</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Prioridad</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tareas?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        No hay tareas registradas para este filtro.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tareas?.map((tarea) => (
                                    <TableRow key={tarea.id}>
                                        <TableCell className="font-medium">
                                            {new Date(tarea.fechaProgramada).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{tarea.tipo}</div>
                                            <div className="text-xs text-muted-foreground">{tarea.codigo}</div>
                                        </TableCell>
                                        <TableCell>
                                            {tarea.cliente?.nombre || 'Sin Cliente'}
                                            {tarea.proyecto && <span className="text-muted-foreground"> / {tarea.proyecto.nombre}</span>}
                                        </TableCell>
                                        <TableCell>{tarea.nivel}</TableCell>
                                        <TableCell>{tarea.responsable}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tarea.estado === 'PROGRAMADA' ? 'bg-blue-100 text-blue-800' :
                                                tarea.estado === 'EN_PROCESO' ? 'bg-yellow-100 text-yellow-800' :
                                                    tarea.estado === 'EJECUTADA' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {tarea.estado.replace('_', ' ')}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tarea.prioridad === 'ALTA' ? 'bg-red-100 text-red-800' :
                                                tarea.prioridad === 'MEDIA' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                {tarea.prioridad}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/tareas/${tarea.id}/execute?clienteId=${clienteId || ''}&proyectoId=${proyectoId || ''}`}>
                                                    Gestionar
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
