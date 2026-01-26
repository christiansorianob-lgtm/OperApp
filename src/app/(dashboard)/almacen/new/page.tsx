import { getNombresProducto, getCategoriasProducto, getUnidadesMedida } from "@/app/actions/configuracion"
import { getProyectos } from "@/app/actions/proyectos"
import { ProductoForm } from "@/components/forms/ProductoForm"

export const dynamic = 'force-dynamic'

export default async function NewProductoPage() {
    const nombresRes = await getNombresProducto()
    const categoriasRes = await getCategoriasProducto()
    const unidadesRes = await getUnidadesMedida()
    const proyectosRes = await getProyectos()

    const nombres = nombresRes.data || []
    const categorias = categoriasRes.data || []
    const unidades = unidadesRes.data || []
    const proyectos = proyectosRes.data || []

    return <ProductoForm nombres={nombres} categorias={categorias} unidades={unidades} proyectos={proyectos} />
}
