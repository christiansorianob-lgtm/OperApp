import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getProyectos } from "@/app/actions/proyectos"
import { Plus } from "lucide-react"

export default async function ProyectosPage() {
    const { data: proyectos, error } = await getProyectos()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Proyectos</h2>
                    <p className="text-muted-foreground">Gestión de proyectos</p>
                </div>
                <Button asChild>
                    <Link href="/proyectos/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Proyecto
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Proyectos</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && <p className="text-destructive mb-4">{error}</p>}

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Código</TableHead>
                                <TableHead>Nombre Proyecto</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {proyectos?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No hay proyectos registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                proyectos?.map((proyecto) => (
                                    <TableRow key={proyecto.id}>
                                        <TableCell className="font-medium">{proyecto.cliente.nombre}</TableCell>
                                        <TableCell>{proyecto.codigo}</TableCell>
                                        <TableCell>{proyecto.nombre}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${proyecto.estado === 'EN_EJECUCION' ? 'bg-green-100 text-green-800' :
                                                proyecto.estado === 'FINALIZADO' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {proyecto.estado}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/proyectos/${proyecto.id}/edit`}>Administrar</Link>
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
