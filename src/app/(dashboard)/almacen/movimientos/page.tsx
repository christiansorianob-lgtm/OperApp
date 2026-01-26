import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus } from "lucide-react"
import { db } from "@/lib/db"
import { getProductos } from "@/app/actions/almacen"
import { getProyectos } from "@/app/actions/proyectos"
import { NewAdjustmentDialog } from "@/components/forms/NewAdjustmentDialog"

async function getMovimientos() {
    'use server'
    try {
        const movs = await db.movimientoInventario.findMany({
            include: {
                producto: true,
                proyecto: {
                    include: {
                        cliente: true
                    }
                },
                tarea: {
                    include: {
                        proyecto: true // Tarea linked to Proyecto
                    }
                }
            },
            orderBy: { fecha: 'desc' }
        })
        return { data: movs }
    } catch (e) {
        return { error: "Error al cargar movimientos" }
    }
}

export default async function MovimientosPage() {
    const { data: movimientos, error } = await getMovimientos()
    const { data: productos } = await getProductos()
    const { data: proyectos } = await getProyectos()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/almacen">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Movimientos de Inventario</h2>
                    <p className="text-muted-foreground">Entradas, Salidas y Ajustes</p>
                </div>

                <NewAdjustmentDialog
                    productos={productos || []}
                    proyectos={proyectos || []}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Transacciones</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && <p className="text-destructive mb-4">{error}</p>}

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead>Cantidad</TableHead>
                                <TableHead>Ubicación / Contexto</TableHead>
                                <TableHead>Referencia</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {movimientos?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No hay movimientos registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                movimientos?.map((mov) => {
                                    // Logic for context display
                                    const proyectoNombre = mov.proyecto.nombre
                                    const clienteNombre = mov.proyecto.cliente.nombre

                                    // If movement is linked to a task, show task context
                                    // If movement is manual adjustment, show Project/Bodega context

                                    return (
                                        <TableRow key={mov.id}>
                                            <TableCell className="font-medium">{new Date(mov.fecha).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${mov.tipoMovimiento === 'ENTRADA' ? 'bg-green-100 text-green-800' :
                                                    mov.tipoMovimiento === 'SALIDA' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {mov.tipoMovimiento}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div>{mov.producto.nombre}</div>
                                                <div className="text-xs text-muted-foreground">{mov.producto.codigo}</div>
                                            </TableCell>
                                            <TableCell className="font-bold">
                                                {mov.tipoMovimiento === 'SALIDA' ? '-' : '+'}{mov.cantidad} {mov.producto.unidadMedida}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{proyectoNombre}</span>
                                                    <span className="text-xs text-muted-foreground">{clienteNombre}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{mov.referencia}</span>
                                                    {mov.tarea && (
                                                        <Link href={`/tareas/${mov.tarea.id}/execute`} className="text-xs text-blue-600 hover:underline">
                                                            Ver Tarea: {mov.tarea.tipo}
                                                        </Link>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
