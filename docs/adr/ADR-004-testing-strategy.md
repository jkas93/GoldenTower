# ADR-004: Estrategia de Testing

## Estado
✅ **Aceptado** - Enero 2026

## Contexto

El proyecto tenía una **cobertura de tests muy baja** (~5-10%) con solo 4 archivos de test. Esto generaba:
1. Alto riesgo de regresiones al hacer cambios
2. Imposibilidad de refactorizar con confianza
3. Bugs descubiertos solo en producción
4. Dificultad para incorporar nuevos desarrolladores

## Decisión

Implementar una **pirámide de testing** con 3 niveles:

### 1️⃣ Tests Unitarios (Base - 70% de tests)
**Herramienta**: Jest + ts-jest

**Cobertura**:
- ✅ Servicios NestJS (business logic)
- ✅ Utilidades y helpers
- ✅ Componentes React puros

**Filosofía**: Cada servicio debe tener su `.spec.ts` correspondiente

**Ejemplo**:
```typescript
// finance.service.spec.ts
describe('FinanceService', () => {
  it('should create a purchase and return the id', async () => {
    // ... test isolation with mocks
  });
});
```

### 2️⃣ Tests de Integración (Medio - 20% de tests)
**Herramienta**: Jest + Supertest

**Cobertura**:
- ✅ Controllers + Services + Auth Guards
- ✅ Flujos completos de API
- ✅ Validación de schemas Zod

**Nota**: Actualmente los tests unitarios cubren parte de esto con mocks

### 3️⃣ Tests E2E (Cima - 10% de tests)
**Herramienta**: Playwright

**Cobertura**:
- ✅ Flujos críticos de usuario (login, dashboard)
- ✅ Cross-browser (Chromium, Firefox, WebKit, Mobile)
- ✅ Regresión visual

**Ejemplo**:
```typescript
// e2e/public-pages.spec.ts
test('should display login page', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
});
```

## Métricas Objetivo

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Cobertura Backend | ~40-50% | **>70%** |
| Cobertura Frontend | ~20% | **>60%** |
| Tests unitarios | 54 | **>100** |
| Tests E2E | 5 | **>20** |
| Tiempo de ejecución | ~30s | **<60s** |

## Consecuencias

### ✅ Positivas
- **Confianza**: Refactorizar con red de seguridad
- **Documentación viva**: Tests como ejemplos de uso
- **Detección temprana**: Bugs encontrados antes de producción
- **Onboarding**: Nuevos devs entienden el código más rápido
- **CI/CD**: Tests bloquean deploys con errores

### ⚠️ Negativas / Trade-offs
- **Tiempo de desarrollo**: 20-30% más tiempo por feature
- **Mantenimiento**: Tests deben actualizarse con cambios
- **Falsos positivos**: Tests frágiles pueden fallar aleatoriamente

## Estándares de Testing

### Nomenclatura
- `*.spec.ts` para tests unitarios/integración (Jest)
- `*.test.ts` para tests generales
- `e2e/*.spec.ts` para tests E2E (Playwright)

### Estructura AAA
```typescript
it('should do something', () => {
  // Arrange: preparar datos
  const input = { ... };
  
  // Act: ejecutar la acción
  const result = service.method(input);
  
  // Assert: verificar resultado
  expect(result).toBe(expected);
});
```

### Mocks
- ✅ Mockear dependencias externas (Firebase, HTTP)
- ✅ Usar Jest mocks para servicios
- ❌ NO mockear la lógica que estás probando

## CI/CD Integration

Los tests se ejecutan automáticamente en:
1. **Pre-commit** (opcional con Husky)
2. **Pull Requests** (obligatorio para merge)
3. **Antes del deploy** (bloquea deploy si fallan)

Configurado en `.github/workflows/deploy-firebase.yml`

## Alternativas Consideradas

### 1. Solo tests E2E
- ❌ Muy lentos
- ❌ Difícil aislar bugs
- ❌ Frágiles

### 2. Solo tests unitarios
- ⚠️ No detecta problemas de integración
- ⚠️ Puede pasar con bugs en producción

### 3. Snapshot testing
- ⚠️ Útil pero no suficiente
- ⚠️ Puede volverse ruidoso

## Referencias
- [Testing Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
