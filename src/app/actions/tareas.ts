'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function getTareas(filters?: { obraId?: string, frenteId?: string, nivel?: "CLIENTE" | "PROYECTO", estado?: string[], delayed?: boolean }) {
    try {
        const where: any = {}
        // Map legacy filters if passed, or use new keys if updated elsewhere
        if (filters?.obraId) where.clienteId = filters.obraId
        if (filters?.frenteId) where.proyectoId = filters.frenteId
        if (filters?.nivel) where.nivel = filters.nivel

        if (filters?.estado && filters.estado.length > 0) {
            where.estado = { in: filters.estado }
        }

        if (filters?.delayed) {
            where.estado = 'PROGRAMADA'
            where.fechaProgramada = {
                lt: new Date()
            }
        }

        const tareas = await db.tarea.findMany({
            where,
            include: {
                cliente: true,
                proyecto: true
            },
            orderBy: { fechaProgramada: 'desc' }
        })
        return { data: tareas }
    } catch (error) {
        console.error("Failed to fetch tareas:", error)
        return { error: "Error al cargar las tareas." }
    }
}

export async function getTareaById(id: string) {
    try {
        const tarea = await db.tarea.findUnique({
            where: { id },
            include: {
                cliente: true,
                proyecto: true,
                consumos: {
                    include: {
                        producto: true
                    }
                },
                usosMaquinaria: {
                    include: {
                        maquina: {
                            include: {
                                tipo: true,
                                marca: true
                            }
                        } as any
                    }
                },
                reportesFotograficos: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                trazabilidad: {
                    orderBy: {
                        timestamp: 'asc'
                    }
                }
            }
        })
        return { data: tarea }
    } catch (error) {
        console.error("Failed to fetch tarea:", error)
        return { error: "Error al cargar la tarea." }
    }
}

export async function createTarea(formData: FormData) {
    // Map form fields (obraId -> clienteId, frenteId -> proyectoId)
    const clienteId = formData.get("obraId") as string

    // Handle proyectoId
    const rawProyectoId = formData.get("frenteId") as string | null
    const proyectoId = rawProyectoId && rawProyectoId.trim() !== "" ? rawProyectoId : null

    // Infer nivel based on proyectoId presence
    const nivel = proyectoId ? "PROYECTO" : "CLIENTE"

    const fechaProgramada = formData.get("fechaProgramada") as string
    const tipo = formData.get("tipo") as string
    const responsable = formData.get("responsable") as string
    const prioridad = formData.get("prioridad") as "BAJA" | "MEDIA" | "ALTA"
    const estado = formData.get("estado") as "PROGRAMADA" | "EN_PROCESO" | "EJECUTADA" | "CANCELADA"
    const descripcion = formData.get("descripcion") as string
    const observaciones = formData.get("observaciones") as string
    const requiereTrazabilidad = formData.get("requiereTrazabilidad") === "on"

    // Validations
    if (!clienteId || !fechaProgramada || !tipo || !responsable) {
        return { error: "Campos obligatorios faltantes." }
    }

    try {
        // Auto-generate Code
        let finalCodigo = (formData.get("codigo") as string) || ""
        if (!finalCodigo) {
            const count = await db.tarea.count({ where: { clienteId } })
            finalCodigo = `TAR-${(count + 1).toString().padStart(4, '0')}`
        }

        await db.tarea.create({
            data: {
                codigo: finalCodigo,
                clienteId,
                proyectoId: proyectoId || null,
                nivel,
                fechaProgramada: new Date(fechaProgramada),
                tipo,
                descripcion,
                responsable,
                prioridad: prioridad as any || 'MEDIA',
                estado: estado as any || 'PROGRAMADA',
                requiereTrazabilidad,
                observaciones
            }
        })
    } catch (error: any) {
        console.error("Failed to create tarea:", error)
        return { error: `Error al crear la tarea: ${error.message}` }
    }

    revalidatePath('/tareas')
    // redirect('/tareas')
    return { success: true }
}

// EXECUTE TASK ACTION
// EXECUTE TASK ACTION
export async function executeTarea(id: string, formData: FormData) {
    const estado = formData.get("estado") as any
    const observaciones = formData.get("observaciones") as string
    const fechaEjecucion = formData.get("fechaEjecucion") as string
    const consumosStr = formData.get("consumos") as string
    const clienteId = formData.get("obraId") as string // Legacy form field name, maps to clienteId
    // const duracionRealHoras = formData.get("duracionRealHoras")

    const consumos = consumosStr ? JSON.parse(consumosStr) : []

    // Handle File Uploads
    const files = formData.getAll("evidencias") as File[]
    const uploadedUrls: string[] = []

    if (files && files.length > 0) {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "tareas")

        try {
            await mkdir(uploadDir, { recursive: true })
        } catch (e) {
            // Ignore if exists
        }

        for (const file of files) {
            if (file.size === 0) continue;
            const buffer = Buffer.from(await file.arrayBuffer())
            const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`
            const filePath = path.join(uploadDir, fileName)
            try {
                await writeFile(filePath, buffer)
                uploadedUrls.push(`/uploads/tareas/${fileName}`)
            } catch (error) {
                console.error("Error saving file:", error)
            }
        }
    }

    const evidenciasString = uploadedUrls.length > 0 ? uploadedUrls.join('\n') : null
    const maquinariaStr = formData.get("maquinaria") as string
    const usosMaquinaria = maquinariaStr ? JSON.parse(maquinariaStr) : []

    try {
        await db.$transaction(async (tx: any) => {
            // 1. Update Task
            const updatedTarea = await tx.tarea.update({
                where: { id },
                data: {
                    estado,
                    observaciones,
                    evidencias: evidenciasString,
                    fechaEjecucion: fechaEjecucion ? new Date(fechaEjecucion) : new Date(),
                }
            })

            // 2. Process Consumptions
            if (consumos && consumos.length > 0) {
                if (!updatedTarea.proyectoId) {
                    throw new Error("No se pueden registrar consumos en una tarea sin Proyecto asignado (Inventario depende del Proyecto).")
                }

                for (const item of consumos) {
                    // Check stock
                    const producto = await tx.producto.findUnique({ where: { id: item.productoId } })
                    if (!producto) throw new Error(`Producto no encontrado: ${item.productoId}`)

                    if (producto.stockActual < item.cantidad) {
                        throw new Error(`Stock insuficiente para ${producto.nombre}. Stock actual: ${producto.stockActual}`)
                    }

                    // Create Movement
                    await tx.movimientoInventario.create({
                        data: {
                            proyectoId: updatedTarea.proyectoId,
                            productoId: item.productoId,
                            tareaId: id,
                            tipoMovimiento: 'SALIDA',
                            fecha: new Date(),
                            cantidad: item.cantidad,
                            referencia: 'Consumo en Tarea',
                            observaciones: `Consumo registrado en ejecución de tarea`
                        }
                    })

                    // Deduct Stock
                    await tx.producto.update({
                        where: { id: item.productoId },
                        data: {
                            stockActual: { decrement: item.cantidad }
                        }
                    })
                }
            }

            // 3. Process Machinery Usage
            if (usosMaquinaria && usosMaquinaria.length > 0) {
                for (const item of usosMaquinaria) {
                    // Validate machine exists
                    const machine = await tx.maquinaria.findUnique({ where: { id: item.maquinaId } })
                    if (!machine) throw new Error(`Maquinaria no encontrada: ${item.maquinaId}`)

                    // Create Usage Record
                    await tx.usoMaquinaria.create({
                        data: {
                            maquinaId: item.maquinaId,
                            tareaId: id,
                            proyectoId: updatedTarea.proyectoId || null, // Optional
                            operador: "N/A", // We don't have operator field in form yet, default to N/A or derive
                            fechaInicio: new Date(),
                            fechaFin: new Date(new Date().getTime() + (item.horas * 60 * 60 * 1000)), // Approximate end time
                            horasUso: item.horas,
                            observaciones: `Uso registrado en ejecución de tarea`
                        }
                    })
                }
            }
        })
    } catch (error: any) {
        console.error("Failed to execute tarea:", error)
        return { error: error.message || "Error al registrar ejecución." }
    }

    revalidatePath('/tareas')
    revalidatePath('/almacen')
    redirect('/tareas')
}
