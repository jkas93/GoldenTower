# 📋 Architecture Decision Records (ADRs)

Este directorio contiene los Architecture Decision Records (ADRs) del proyecto Golden Tower ERP.

## ¿Qué son los ADRs?

Los ADRs documentan decisiones arquitectónicas importantes, incluyendo el contexto, la decisión tomada, las consecuencias esperadas y las alternativas consideradas.

## Estructura

Cada ADR sigue este formato:
- **Título**: Breve descripción de la decisión
- **Estado**: Propuesto / Aceptado / Superseded / Deprecado
- **Contexto**: Situación actual y problema a resolver
- **Decisión**: Qué se decidió y por qué
- **Consecuencias**: Impactos positivos y negativos
- **Alternativas**: Otras opciones consideradas

## Índice de ADRs

- [ADR-001: Monorepo con TurboRepo](./ADR-001-monorepo-turborepo.md)
- [ADR-002: NestJS en Firebase Cloud Functions](./ADR-002-nestjs-cloud-functions.md)
- [ADR-003: Unificación Usuario/Empleado](./ADR-003-user-employee-unification.md)
- [ADR-004: Estrategia de Testing](./ADR-004-testing-strategy.md)
- [ADR-005: Rate Limiting y Audit Logging](./ADR-005-security-interceptors.md)

## Cómo agregar un nuevo ADR

1. Copiar el template desde `ADR-000-template.md`
2. Numerar secuencialmente
3. Nombre descriptivo con guiones
4. Actualizar este README con el nuevo ADR
5. Discutir con el equipo antes de marcarlo como "Aceptado"
