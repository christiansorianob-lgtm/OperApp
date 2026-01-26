import { getClientSession } from "@/app/actions/auth-client"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Activity, ArrowRight, Package } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function PortalDashboard() {
    const session = await getClientSession()
    if (!session) return null // Handled by layout

    // Fetch Client's Projects
    const projects = await db.proyecto.findMany({
        where: {
            clienteId: session.id,
            estado: { not: 'CANCELADO' }
        },
        include: {
            _count: {
                select: { tareas: true, maquinarias: true }
            }
        },
        orderBy: { updatedAt: 'desc' }
    })

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Bienvenido, {session.nombre}</h2>
                <p className="text-muted-foreground mt-2">
                    Aquí puede visualizar el estado y avance de sus proyectos activos en tiempo real.
                </p>
            </div>

            {projects.length === 0 ? (
                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Package className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">No hay proyectos asignados</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">
                            Aún no tiene proyectos activos vinculados a su cuenta. Contacte a la administración si cree que esto es un error.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Card key={project.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary/30">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="mb-2 uppercase text-[10px] tracking-wider">
                                        {project.estado}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl line-clamp-1">{project.nombre}</CardTitle>
                                <CardDescription className="flex items-center mt-1">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {project.municipio || 'Sin ubicación'}, {project.departamento}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {project.descripcion && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                                        {project.descripcion}
                                    </p>
                                )}

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Activity className="w-3 h-3" /> Tareas Activas
                                        </span>
                                        <p className="text-xl font-bold">{project._count.tareas}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Inicio
                                        </span>
                                        <p className="text-sm font-medium">
                                            {project.fechaInicio ? project.fechaInicio.toLocaleDateString() : 'Pendiente'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2">
                                <Button className="w-full" asChild>
                                    <Link href={`/portal/proyecto/${project.id}`}>
                                        Ver Detalles <ArrowRight className="ml-2 w-4 h-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
