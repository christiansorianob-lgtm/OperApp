
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const colombiaData = [
    {
        departamento: 'Meta',
        municipios: ['Villavicencio', 'San Martín', 'Granada', 'Puerto López', 'Puerto Gaitán', 'Acacías', 'Castilla la Nueva', 'Cumaral', 'Restrepo', 'San Carlos de Guaroa']
    },
    {
        departamento: 'Cesar',
        municipios: [
            'Valledupar', 'Aguachica', 'Agustín Codazzi', 'Astrea', 'Becerril', 'Bosconia',
            'Chimichagua', 'Chiriguaná', 'Curumaní', 'El Copey', 'El Paso', 'Gamarra',
            'González', 'La Gloria', 'La Jagua de Ibirico', 'La Paz', 'Manaure Balcón del Cesar',
            'Pailitas', 'Pelaya', 'Pueblo Bello', 'Río de Oro', 'San Alberto', 'San Diego',
            'San Martín', 'Tamalameque'
        ]
    },
    {
        departamento: 'Santander',
        municipios: ['Bucaramanga', 'Barrancabermeja', 'San Gil', 'Piedecuesta', 'Floridablanca', 'Girón', 'Sabana de Torres', 'Puerto Wilches']
    },
    {
        departamento: 'Magdalena',
        municipios: ['Santa Marta', 'Ciénaga', 'Fundación', 'El Banco', 'Aracataca', 'Zona Bananera']
    },
    {
        departamento: 'Cundinamarca',
        municipios: ['Bogotá D.C.', 'Soacha', 'Girardot', 'Zipaquirá', 'Facatativá', 'Chía', 'Mosquera', 'Madrid', 'Funza']
    },
    {
        departamento: 'Casanare',
        municipios: ['Yopal', 'Aguazul', 'Villanueva', 'Paz de Ariporo', 'Maní', 'Tauramena', 'Monterrey']
    }
]

async function main() {
    console.log('Start seeding locations...')

    // --- SEED LOCATIONS ---
    console.log('Start seeding locations...')
    for (const data of colombiaData) {
        // Create Department
        let dept = await prisma.departamento.findUnique({ where: { nombre: data.departamento } })
        if (!dept) {
            dept = await prisma.departamento.create({ data: { nombre: data.departamento } })
        }

        // Create Municipios
        for (const muniName of data.municipios) {
            // Check if exists in this dept
            // Since we don't have unique constraint on name alone (only ID), and we want to avoid duplicates if possible.
            // But usually unique constraint is on ID. 
            // We can check if a municipality with this name exists in this department
            const muniExists = await prisma.municipio.findFirst({
                where: {
                    nombre: muniName,
                    departamentoId: dept.id
                }
            })

            if (!muniExists) {
                await prisma.municipio.create({
                    data: {
                        nombre: muniName,
                        departamentoId: dept.id
                    }
                })
            }
        }
    }
    console.log('Locations seeding finished.')

    // --- SEED MAQUINARIA ---
    console.log('Start seeding machinery catalogs...')

    const tiposMaquinaria = ['Retroexcavadora', 'Excavadora', 'Volqueta', 'Minicargador', 'Motoniveladora', 'Vibrocompactador', 'Torre Grúa', 'Mixer', 'Camión Grúa']
    for (const nombre of tiposMaquinaria) {
        const exists = await prisma.tipoMaquinaria.findFirst({ where: { nombre } })
        if (!exists) {
            await prisma.tipoMaquinaria.create({ data: { nombre } })
        }
    }

    const marcasMaquinaria = ['CAT (Caterpillar)', 'Komatsu', 'Bobcat', 'Case', 'Volvo', 'Hitachi', 'John Deere', 'JCB', 'Doosan']
    for (const nombre of marcasMaquinaria) {
        const exists = await prisma.marcaMaquinaria.findFirst({ where: { nombre } })
        if (!exists) {
            await prisma.marcaMaquinaria.create({ data: { nombre } })
        }
    }

    const ubicacionesMaquinaria = ['Patio Central', 'Taller Principal', 'Obra (En Sitio)', 'Alquilada']
    for (const nombre of ubicacionesMaquinaria) {
        const exists = await prisma.ubicacionMaquinaria.findFirst({ where: { nombre } })
        if (!exists) {
            await prisma.ubicacionMaquinaria.create({ data: { nombre } })
        }
    }

    console.log('Machinery seeding finished.')



    // --- SEED TIPO ACTIVIDAD ---
    console.log('Start seeding activity types...')
    const actividades = [
        'Preliminares / Cerramiento',
        'Cimentación',
        'Estructura Concreto',
        'Estructura Metálica',
        'Mampostería',
        'Pañetes y Frisos',
        'Instalaciones Hidrosanitarias',
        'Instalaciones Eléctricas',
        'Pisos y Enchapes',
        'Carpintería',
        'Pintura y Acabados',
        'Urbanismo'
    ]

    for (const nombre of actividades) {
        const exists = await prisma.tipoActividad.findUnique({ where: { nombre } })
        if (!exists) {
            await prisma.tipoActividad.create({ data: { nombre } })
        }
    }
    console.log('Activity types seeding finished.')

    // --- SEED PRODUCTOS CATALOGOS ---
    console.log('Start seeding product catalogs...')
    const unidadesMedida = ["Kilogramo (kg)", "Metro Cúbico (m3)", "Metro Cuadrado (m2)", "Metro Lineal (ml)", "Bulto", "Galón", "Unidad", "Varilla (6m)", "Rollo"]

    for (const nombre of unidadesMedida) {
        const exists = await prisma.unidadMedida.findUnique({ where: { nombre } })
        if (!exists) { await prisma.unidadMedida.create({ data: { nombre } }) }
    }

    // Structured Catalog with Correct Categorization
    const catalogoProductos = [
        {
            categoria: "Cemento y Agregados",
            productos: ["Cemento Gris Uso General", "Cemento Blanco", "Arena de Río", "Arena de Peña", "Triturado 3/4", "Piedra Rajón"]
        },
        {
            categoria: "Acero y Refuerzo",
            productos: ["Varilla Corrugada 3/8", "Varilla Corrugada 1/2", "Varilla Corrugada 5/8", "Malla Electrosoldada", "Alambre Negro"]
        },
        {
            categoria: "Mampostería",
            productos: ["Ladrillo tolete común", "Bloque #4", "Bloque #5", "Adoquín vehicular"]
        },
        {
            categoria: "Tubería PVC",
            productos: ["Tubo Sanitario 4 pulg", "Tubo Sanitario 2 pulg", "Tubo Presión 1/2", "Accesorios PVC"]
        },
        {
            categoria: "Combustible",
            productos: ["Gasolina Corriente", "ACPM (Diesel)"]
        },
        {
            categoria: "Dotación y EPP",
            productos: ["Casco de Seguridad", "Botas de Caucho", "Guantes de Carnaza", "Gafas de Protección", "Chaleco Reflectivo"]
        },
        {
            categoria: "Herramienta Menor",
            productos: ["Pala Redonda", "Pica", "Barra", "Martillo", "Flexómetro", "Nivel"]
        }
    ]

    for (const grupo of catalogoProductos) {
        // 1. Ensure Category Exists
        let cat = await prisma.categoriaProducto.findUnique({ where: { nombre: grupo.categoria } })
        if (!cat) {
            cat = await prisma.categoriaProducto.create({ data: { nombre: grupo.categoria } })
        }

        // 2. Create Products linked to this Category
        for (const prodNombre of grupo.productos) {
            const prodExists = await prisma.nombreProducto.findUnique({ where: { nombre: prodNombre } })

            if (!prodExists) {
                await prisma.nombreProducto.create({
                    data: {
                        nombre: prodNombre,
                        categoriaId: cat.id // CRITICAL: Link to category
                    }
                })
            } else {
                // Optional: Update category if it was missing (fix existing bad data)
                if (prodExists.categoriaId !== cat.id) {
                    await prisma.nombreProducto.update({
                        where: { id: prodExists.id },
                        data: { categoriaId: cat.id }
                    })
                }
            }
        }
    }
    console.log('Product catalogs seeding finished.')

    // --- SEED CARGOS ---
    console.log('Start seeding cargos...')
    const cargos = [
        "Director de Obra", "Ingeniero Residente", "Maestro de Obra", "Oficial de Construcción",
        "Ayudante Práctico", "Ayudante Raso", "Almacenista",
        "Inspector SISO", "Operador de Maquinaria", "Vigilante"
    ]
    for (const nombre of cargos) {
        const exists = await prisma.cargo.findUnique({ where: { nombre } })
        if (!exists) {
            await prisma.cargo.create({ data: { nombre } })
        }
    }
    console.log('Cargos seeding finished.')


    // --- SEED ADMIN USER ---
    // --- SEED ADMIN USER (WEB ACCESS) ---
    console.log('Seeding admin user (Usuario)...')
    const adminEmail = 'christiansorianob@gmail.com'
    const adminPass = '123456'

    // Check if Usuario exists
    const existingAdmin = await prisma.usuario.findUnique({
        where: { email: adminEmail }
    })

    if (!existingAdmin) {
        await prisma.usuario.create({
            data: {
                nombre: 'Christian Soriano',
                email: adminEmail,
                password: adminPass,
                perfil: 'ADMINISTRADOR',
                activo: true
            }
        })
        console.log(`Admin User created: ${adminEmail} / ${adminPass}`)
    } else {
        // Update to ensure profile is correct
        await prisma.usuario.update({
            where: { id: existingAdmin.id },
            data: {
                nombre: 'Christian Soriano',
                password: adminPass,
                perfil: 'ADMINISTRADOR'
            }
        })
        console.log('Admin User updated.')
    }

    // --- SEED OPERATIONAL STAFF (RESPONSABLE) ---
    // Ensure 'Administrador' cargo exists for the staff record too
    let adminCargo = await prisma.cargo.findUnique({ where: { nombre: 'Administrador' } })
    if (!adminCargo) {
        adminCargo = await prisma.cargo.create({ data: { nombre: 'Administrador' } })
    }

    // Create a Responsable record for Christian for mobile tasks 
    // (separate from his Web Admin user, though functionally the same person)
    const adminStaff = await prisma.responsable.findUnique({ where: { nombre: 'Christian Soriano' } })
    if (!adminStaff) {
        await prisma.responsable.create({
            data: {
                nombre: 'Christian Soriano',
                email: adminEmail,
                password: '123456', // Mobile App Password
                cargoId: adminCargo.id,
                activo: true
            }
        })
        console.log('Responsable (Staff) created for mobile access.')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
