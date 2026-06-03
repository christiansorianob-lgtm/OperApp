const fs = require('fs');
const path = require('path');

const directory = 'c:/PROYECTOS WEB/OPERAPP/src';

const filesToUpdate = [
    "app/(dashboard)/almacen/movimientos/page.tsx",
    "app/(dashboard)/clientes/[id]/page.tsx",
    "app/(dashboard)/maquinaria/uso/page.tsx",
    "app/(dashboard)/page.tsx",
    "app/(dashboard)/proyectos/[id]/page.tsx",
    "app/(dashboard)/tareas/[id]/execute/page.tsx",
    "app/portal/page.tsx",
    "app/portal/proyecto/[id]/page.tsx",
    "components/forms/UsoMaquinariaForm.tsx",
    "components/portal/PortalTaskDetailView.tsx"
];

filesToUpdate.forEach(file => {
    const filePath = path.join(directory, file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add import if not present
    if (!content.includes('import { formatDate } from "@/lib/utils"')) {
        // Add after the last import
        const lines = content.split('\n');
        let lastImportIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
                lastImportIndex = i;
            }
        }
        lines.splice(lastImportIndex + 1, 0, 'import { formatDate } from "@/lib/utils"');
        content = lines.join('\n');
    }

    // Patterns to replace
    content = content.replace(/\{new Date\(([^)]+)\)\.toLocaleDateString\(([^)]*)\)\}/g, '{formatDate($1)}');
    content = content.replace(/\{new Date\(([^)]+)\)\.toLocaleDateString\(\)\}/g, '{formatDate($1)}');
    content = content.replace(/\{([^.]+)\.toLocaleDateString\(\)\}/g, '{formatDate($1)}');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
});
