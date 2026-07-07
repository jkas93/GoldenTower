/**
 * Script para ejecutar anÃ¡lisis y limpieza de duplicados
 * Ejecutar con: node scripts/run-cleanup.mjs
 */

const API_URL = 'http://localhost:4001/rrhh/maintenance';

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

async function analyzeDuplicates() {
    console.log(`${colors.cyan}ðŸ” Analizando duplicados...${colors.reset}\n`);

    try {
        const response = await fetch(`${API_URL}/analyze-duplicates`);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(`HTTP ${response.status}: ${error.message}`);
        }

        const data = await response.json();

        console.log(`${colors.white}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
        console.log(`${colors.cyan}ðŸ“Š ANÃLISIS DE DUPLICADOS${colors.reset}`);
        console.log(`${colors.white}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}\n`);

        console.log(`Total de empleados: ${colors.white}${data.summary.totalEmployees}${colors.reset}`);
        console.log(`DNIs con duplicados: ${colors.yellow}${data.summary.dniDuplicatesCount}${colors.reset}`);
        console.log(`Emails con duplicados: ${colors.yellow}${data.summary.emailDuplicatesCount}${colors.reset}`);
        console.log(`Total a eliminar: ${colors.red}${data.summary.totalRecordsToDelete}${colors.reset}\n`);

        if (data.summary.dniDuplicatesCount > 0) {
            console.log(`${colors.red}ðŸ”´ DNIs DUPLICADOS:${colors.reset}`);
            data.dniDuplicates.forEach(dup => {
                console.log(`\n  DNI: ${colors.yellow}${dup.dni}${colors.reset} (${dup.count} registros)`);
                dup.records.forEach(rec => {
                    const status = rec.willKeep
                        ? `${colors.green}âœ… MANTENER${colors.reset}`
                        : `${colors.red}âŒ ELIMINAR${colors.reset}`;
                    console.log(`    ${status} - ${rec.name} (${rec.email})`);
                });
            });
            console.log('');
        }

        if (data.summary.emailDuplicatesCount > 0) {
            console.log(`${colors.blue}ðŸ”µ EMAILS DUPLICADOS:${colors.reset}`);
            data.emailDuplicates.forEach(dup => {
                console.log(`\n  Email: ${colors.yellow}${dup.email}${colors.reset} (${dup.count} registros)`);
                dup.records.forEach(rec => {
                    const status = rec.willKeep
                        ? `${colors.green}âœ… MANTENER${colors.reset}`
                        : `${colors.blue}âŒ ELIMINAR${colors.reset}`;
                    console.log(`    ${status} - ${rec.name} (DNI: ${rec.dni})`);
                });
            });
            console.log('');
        }

        if (!data.hasDuplicates) {
            console.log(`${colors.green}âœ… La base de datos estÃ¡ limpia. No hay duplicados.${colors.reset}\n`);
        }

        return data;
    } catch (error) {
        console.error(`${colors.red}âŒ Error al analizar:${colors.reset}`, error.message);
        throw error;
    }
}

async function cleanupDuplicates() {
    console.log(`${colors.yellow}\nâš ï¸  ADVERTENCIA: Esta acciÃ³n es IRREVERSIBLE${colors.reset}`);
    console.log(`  Se eliminarÃ¡n permanentemente los registros duplicados mÃ¡s antiguos.\n`);

    // En un entorno real, aquÃ­ pedirÃ­as confirmaciÃ³n del usuario
    console.log(`${colors.cyan}ðŸ§¹ Ejecutando limpieza...${colors.reset}\n`);

    try {
        const response = await fetch(`${API_URL}/cleanup-duplicates`, {
            method: 'POST'
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(`HTTP ${response.status}: ${error.message}`);
        }

        const data = await response.json();

        console.log(`${colors.white}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}`);
        console.log(`${colors.green}âœ… LIMPIEZA COMPLETADA${colors.reset}`);
        console.log(`${colors.white}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${colors.reset}\n`);

        console.log(`${data.message}\n`);
        console.log(`Total eliminados: ${colors.green}${data.deleted}${colors.reset}`);
        console.log(`Por DNI duplicado: ${colors.yellow}${data.details.deletedByDni}${colors.reset}`);
        console.log(`Por Email duplicado: ${colors.blue}${data.details.deletedByEmail}${colors.reset}\n`);

        if (data.details.records.length > 0) {
            console.log(`${colors.cyan}ðŸ“ Registros eliminados:${colors.reset}\n`);
            data.details.records.forEach((rec, i) => {
                console.log(`  ${i + 1}. ${rec.name}`);
                console.log(`     RazÃ³n: ${rec.reason}`);
                console.log(`     DNI: ${rec.dni || 'N/A'} | Email: ${rec.email || 'N/A'}`);
                console.log(`     ID eliminado: ${rec.id} | ID conservado: ${rec.kept}\n`);
            });
        }

        return data;
    } catch (error) {
        console.error(`${colors.red}âŒ Error al limpiar:${colors.reset}`, error.message);
        throw error;
    }
}

// EjecuciÃ³n principal
(async () => {
    try {
        // AnÃ¡lisis
        const analysis = await analyzeDuplicates();

        // Si hay duplicados, preguntar si limpiar
        if (analysis.hasDuplicates && process.argv.includes('--clean')) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Pausa de 2 segundos
            await cleanupDuplicates();
        } else if (analysis.hasDuplicates) {
            console.log(`${colors.yellow}ðŸ’¡ Para ejecutar la limpieza, ejecuta:${colors.reset}`);
            console.log(`   node scripts/run-cleanup.mjs --clean\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error(`\n${colors.red}âŒ Error fatal:${colors.reset}`, error.message);
        process.exit(1);
    }
})();
