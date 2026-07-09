# ADR-001: Monorepo con TurboRepo

## Estado
✅ **Aceptado** - Enero 2026

## Contexto

El proyecto Golden Tower ERP consta de múltiples aplicaciones y paquetes:
- **Frontend web** (Next.js)
- **Backend API** (NestJS + Firebase Functions)
- **Documentación** (Next.js)
- **Paquetes compartidos** (schemas, tipos, componentes UI)

Necesitábamos una estructura que permitiera:
1. Compartir código entre proyectos (tipos, schemas Zod)
2. Deploy independiente de cada aplicación
3. Builds optimizados (solo recompilar lo cambiado)
4. Desarrollo local rápido

## Decisión

Adoptar **TurboRepo** como gestor de monorepo con la siguiente estructura:

```
GoldenTower/
├── apps/
│   ├── api/          # Backend NestJS
│   ├── web/          # Frontend Next.js
│   └── docs/         # Documentación
├── packages/
│   ├── shared/       # Zod schemas + tipos TypeScript
│   ├── ui/           # Componentes UI compartidos
│   ├── eslint-config/
│   └── typescript-config/
└── turbo.json        # Configuración de Turbo
```

## Consecuencias

### ✅ Positivas
- **Compartición de código**: `@erp/shared` con schemas Zod usados en frontend y backend
- **Builds paralelos**: Turbo ejecuta builds/tests en paralelo
- **Cache inteligente**: Solo re-compila lo cambiado
- **Desarrollo simplificado**: Un solo `npm run dev` levanta todo
- **Consistencia**: Configuraciones ESLint/TypeScript compartidas

### ⚠️ Negativas / Trade-offs
- **Deploy más complejo**: Firebase Functions necesita el `.tgz` de shared
- **Curva de aprendizaje**: Nuevos devs deben aprender TurboRepo
- **Node.js version**: Requiere Node 22+ (workspaces)

## Alternativas Consideradas

### 1. Multi-repo (2+ repositorios)
- ❌ Compartir código requiere publicar paquetes NPM
- ❌ Sincronizar cambios entre repos es tedioso
- ❌ Version drift entre schemas

### 2. Lerna
- ❌ Menos performante que TurboRepo
- ❌ Configuración más compleja
- ⚠️ Cache limitado

### 3. Nx
- ✅ Muy potente
- ❌ Curva de aprendizaje mayor
- ❌ Más pesado que TurboRepo
- ❌ Overkill para el tamaño del proyecto

## Referencias
- [TurboRepo Documentation](https://turbo.build/repo/docs)
- [Monorepo Explained](https://monorepo.tools/)
