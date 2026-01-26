'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getProductos(proyectoId?: string) {
    try {
        const whereClause = proyectoId ? { proyectoId } : {}
        const productos = await db.producto.findMany({
            where: whereClause,
            orderBy: { nombre: 'asc' },
            include: {
                movimientos: true,
                proyecto: true
            }
        })
        return { data: productos }
    } catch (error) {
        console.error("Failed to fetch productos:", error)
        return { error: "Error al cargar productos." }
    }
}

// export async function getProductos(obraId: string) { ... } -> Updated below

export async function createProducto(formData: FormData) {
    const nombre = formData.get("nombre") as string
    const categoria = formData.get("categoria") as string
    const unidadMedida = formData.get("unidadMedida") as string
    const cantidadStr = formData.get("cantidad") as string
    const proyectoId = formData.get("proyectoId") as string
    const stockActual = parseFloat(cantidadStr) || 0

    if (!proyectoId) return { error: "Debe seleccionar un Proyecto." }
    if (!categoria) return { error: "Debe seleccionar una Categoría." }
    if (!nombre) return { error: "Debe seleccionar un Nombre Comercial." }
    if (!unidadMedida) return { error: "Debe seleccionar una Unidad de Medida." }

    try {
        // Auto-generate code PER FINCA if possible, or global uniqueness?
        // Schema has @@unique([obraId, codigo]).
        // We need to count products IN THIS FINCA to generate consecutive code.
        const count = await db.producto.count({ where: { proyectoId } })
        const codigo = `PRO-${(count + 1).toString().padStart(3, '0')}`

        const newProducto = await db.producto.create({
            data: {
                codigo,
                nombre,
                categoria,
                unidadMedida,
                stockActual,
                proyectoId
            }
        })

        // Create initial stock movement if quantity > 0
        await createInitialStockMovement(newProducto.id, stockActual, proyectoId)

        const disableRedirect = formData.get("disable_redirect") === "true"
        if (disableRedirect) {
            revalidatePath('/almacen')
            return { success: true, data: newProducto }
        }
    } catch (error) {
        console.error("Failed to create producto:", error)
        return { error: "Error al crear producto." }
    }

    revalidatePath('/almacen')
    redirect('/almacen')
}

// Logic for Movements would go here (createMovimiento)

// ... previous code

async function createInitialStockMovement(productoId: string, cantidad: number, proyectoId: string) {
    if (cantidad <= 0) return

    // We use the passed obraId, no need to findFirst random one.
    await db.movimientoInventario.create({
        data: {
            proyectoId,
            productoId,
            tipoMovimiento: 'ENTRADA',
            fecha: new Date(),
            cantidad,
            referencia: 'Inventario Inicial (Creación)',
            observaciones: 'Generado automáticamente al crear el producto'
        }
    })
}

export async function createAjusteInventario(formData: FormData) {
    const productoId = formData.get("productoId") as string
    const proyectoId = formData.get("proyectoId") as string
    const tipoMovimiento = formData.get("tipoMovimiento") as "ENTRADA" | "SALIDA"
    const cantidadStr = formData.get("cantidad") as string
    const observaciones = formData.get("observaciones") as string

    const cantidad = parseFloat(cantidadStr)

    if (!productoId || !proyectoId || !tipoMovimiento || !cantidad || cantidad <= 0) {
        return { error: "Datos inválidos. Verifique los campos." }
    }

    try {
        await db.$transaction(async (tx) => {
            const producto = await tx.producto.findUnique({ where: { id: productoId } })
            if (!producto) throw new Error("Producto no encontrado")

            if (tipoMovimiento === 'SALIDA') {
                if (producto.stockActual < cantidad) {
                    throw new Error(`Stock insuficiente. Disponible: ${producto.stockActual}`)
                }
            }

            // Create Movement
            await tx.movimientoInventario.create({
                data: {
                    proyectoId,
                    productoId,
                    tipoMovimiento,
                    fecha: new Date(),
                    cantidad,
                    referencia: 'Ajuste Manual / Compra',
                    observaciones: observaciones || "Movimiento manual registrado desde inventario"
                }
            })

            // Update Stock
            const stockChange = tipoMovimiento === 'ENTRADA' ? cantidad : -cantidad
            await tx.producto.update({
                where: { id: productoId },
                data: {
                    stockActual: { increment: stockChange }
                }
            })
        })

        revalidatePath('/almacen')
        revalidatePath('/almacen/movimientos')
        return { success: true }
    } catch (error: any) {
        console.error("Error creating adjustment:", error)
        return { error: error.message || "Error al procesar el ajuste" }
    }
}
