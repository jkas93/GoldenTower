# ADR-003: Unificación Usuario/Empleado

## Estado
✅ **Aceptado** - Enero 2026  
🚧 **En implementación** - Script listo, migración pendiente

## Contexto

El sistema originalmente mantenía **DOS entidades separadas** para representar a una misma persona:

### Situación Original (Problemática)
```
Colección 'users'                    Colección 'employees'
─────────────────────                ──────────────────────
ID: UID de Firebase Auth             ID: Aleatorio (ej: "emp-xyz789")
{                                    {
  uid: "abc123",                       id: "emp-xyz789",
  email: "juan@gt.com",                dni: "12345678",
  role: "SUPERVISOR",                  fullName: "Juan Pérez",
  ...                                  email: "juan@gt.com",  ← DUPLICADO
}                                      role: "SUPERVISOR",     ← DUPLICADO
                                       ...
                                     }
```

### Problemas Identificados
1. ❌ **Duplicidad de datos**: Email, nombre y rol en ambas colecciones
2. ❌ **Inconsistencias**: Actualizar en una y no en otra genera bugs
3. ❌ **Queries ineficientes**: Buscar empleado por UID requiere query adicional
4. ❌ **Complejidad**: Sincronización manual entre colecciones
5. ❌ **Bug potencial**: Crear empleado sin usuario (no puede loguearse)

## Decisión

**Unificar todo en la colección `employees`** usando el **UID de Firebase Auth** como identificador único.

### Nueva Estructura
```
Colección 'employees' (única fuente de verdad)
─────────────────────────────────────────────
ID: UID de Firebase Auth (mismo UID)
{
  id: "abc123",              ← UID de Auth
  uid: "abc123",             ← Redundancia intencional para queries
  email: "juan@gt.com",
  fullName: "Juan Pérez",
  dni: "12345678",
  role: "SUPERVISOR",
  status: "ACTIVO",
  hasLaborProfile: true,
  ...
}
```

### Plan de Migración
1. **Fase 1** ✅ - Modificar `createEmployee` para usar UID como ID
2. **Fase 2** ✅ - Crear script de migración de datos existentes
3. **Fase 3** 🚧 - Ejecutar migración en producción (pendiente)
4. **Fase 4** 🚧 - Eliminar colección `users` (post-migración)

## Consecuencias

### ✅ Positivas
- **Unicidad garantizada**: Un UID = Una persona
- **Queries directas**: `db.collection('employees').doc(uid).get()`
- **Sin duplicidad**: Una sola fuente de verdad
- **Simplicidad**: Menos código, menos bugs
- **Consistencia**: Imposible desincronización

### ⚠️ Negativas / Trade-offs
- **Migración compleja**: Datos existentes deben migrarse cuidadosamente
- **Downtime potencial**: Requiere ventana de mantenimiento
- **Riesgo de pérdida**: Requiere backup antes de migrar

### 🔄 Compatibilidad
El script de migración maneja **3 casos**:
1. **Merge**: Employee ya existe con mismo UID
2. **Migration**: Employee con mismo email pero diferente ID
3. **Create**: Usuario sin ficha laboral

## Implementación

### Script de Migración
```bash
cd apps/api
npm run migrate:users
```

Ubicado en: `apps/api/src/scripts/migrate-users-to-employees.ts`

### Cambios en Código
- ✅ `RRHHService.createEmployee` usa UID
- ✅ `UsersService.register` compatible con nueva estructura
- 🚧 `RRHHService.findOneEmployee` - eliminar fallback a `users`

## Alternativas Consideradas

### 1. Mantener estructura dual con mejor sincronización
- ❌ No resuelve el problema de fondo
- ❌ Añade complejidad en lugar de reducirla
- ❌ Riesgo continuo de desincronización

### 2. Renombrar a `users` en lugar de `employees`
- ⚠️ Menos semántico para el negocio
- ⚠️ Requeriría cambios en más lugares
- ❌ "Empleado" es más específico y descriptivo

### 3. Usar solo `users`
- ❌ Perdemos contexto laboral específico
- ❌ Colección crecería con campos no relacionados

## Referencias
- Documento original: `/docs/PROPUESTA_UNIFICACION_ARQUITECTURA.md`
- Análisis del problema: `/docs/ANALISIS_USUARIOS_VS_EMPLEADOS.md`
- Script: `apps/api/src/scripts/migrate-users-to-employees.ts`
