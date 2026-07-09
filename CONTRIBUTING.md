# 🤝 Guía de Contribución - Golden Tower ERP

¡Gracias por considerar contribuir a Golden Tower! Esta guía te ayudará a comenzar.

## 📋 Índice

- [Código de Conducta](#código-de-conducta)
- [Configuración del Entorno](#configuración-del-entorno)
- [Workflow de Desarrollo](#workflow-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Testing](#testing)
- [Pull Requests](#pull-requests)
- [Reportar Bugs](#reportar-bugs)

## 🤗 Código de Conducta

- Sé respetuoso y constructivo
- Da y recibe feedback con humildad
- Ayuda a otros contribuidores
- Enfócate en lo que es mejor para el proyecto

## ⚙️ Configuración del Entorno

### Prerrequisitos

- **Node.js** >= 22
- **npm** >= 11.5.1
- **Firebase CLI** (para deploy y emulator)
- **Cuenta de Firebase** (para desarrollo)

### Setup Inicial

```bash
# 1. Clonar el repositorio
git clone https://github.com/jkas93/GoldenTower.git
cd GoldenTower

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Editar los archivos con tus valores

# 4. Iniciar en modo desarrollo
npm run dev
```

## 🔄 Workflow de Desarrollo

### 1. Crear una rama

```bash
# Feature
git checkout -b feature/nombre-descriptivo

# Bug fix
git checkout -b fix/descripcion-del-bug

# Refactor
git checkout -b refactor/area-afectada

# Docs
git checkout -b docs/tema-documentacion
```

### 2. Hacer cambios y commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add pagination to projects list"
git commit -m "fix: resolve infinite loop in useToast hook"
git commit -m "refactor: extract auth validation to service"
git commit -m "test: add unit tests for MaterialsService"
git commit -m "docs: update README with new setup steps"
git commit -m "chore: bump dependencies"
```

**Prefijos válidos**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`

### 3. Ejecutar tests localmente

```bash
# Todos los tests
npm run test

# Con cobertura
npm run test:cov

# Solo backend
cd apps/api && npm run test

# Solo frontend
cd apps/web && npm run test

# E2E (requiere frontend corriendo)
cd apps/web && npm run test:e2e
```

### 4. Verificar linting

```bash
npm run lint
npm run format
```

### 5. Crear Pull Request

- Título descriptivo en inglés o español
- Descripción con contexto y cambios
- Screenshots si hay cambios visuales
- Referenciar issues relacionados

## 📐 Estándares de Código

### TypeScript

**✅ SÍ hacer:**
```typescript
// Interfaces con nombres descriptivos
interface CreateEmployeeDto {
  email: string;
  fullName: string;
  role: UserRole;
}

// Enums en UPPER_CASE
enum UserRole {
  GERENTE = 'GERENTE',
  RRHH = 'RRHH',
}

// Type inference cuando sea obvio
const users = await service.findAll();  // Type inferred

// Explicit return types en funciones públicas
public async findById(id: string): Promise<User | null> {
  return this.repo.findById(id);
}
```

**❌ NO hacer:**
```typescript
// Nombres genéricos
interface Data {  // ❌ Muy genérico
  x: any;
}

// Uso excesivo de any
function process(data: any): any {  // ❌
  return data;
}

// Casts innecesarios
const x = (obj as any).field;  // ❌ Usar tipos apropiados
```

### React / Next.js

**✅ SÍ hacer:**
```tsx
// Componentes con Server Components por defecto
export default function ProjectsPage() {
  // ...
}

// 'use client' solo cuando sea necesario
'use client';
export default function InteractiveWidget() {
  const [state, setState] = useState();
  // ...
}

// Data-testids en elementos interactivos
<button data-testid="submit-btn">Submit</button>
```

### NestJS

**✅ SÍ hacer:**
```typescript
// Guards en controladores
@Controller('rrhh')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class RRHHController {
  // ...
}

// Roles decorator para autorización
@Post('employees')
@Roles(UserRole.GERENTE, UserRole.RRHH)
async createEmployee() { }

// Validación con Zod
@UsePipes(new ZodValidationPipe(EmployeeSchema))
async create(@Body() data: CreateEmployeeDto) { }
```

### Estilo de Código

- **Indentación**: 2 espacios (no tabs)
- **Line length**: Máximo 100 caracteres
- **Quotes**: Single quotes para JS/TS
- **Semicolons**: Sí (siempre)
- **Trailing commas**: Sí (en multi-line)

Todo esto está configurado en `.prettierrc` y `.eslintrc`

## 🧪 Testing

### Cuándo escribir tests

**OBLIGATORIO** escribir tests para:
- ✅ Nuevos servicios (business logic)
- ✅ Bug fixes (test de regresión)
- ✅ Endpoints críticos (auth, financials)
- ✅ Utility functions

**RECOMENDADO** para:
- 🔸 Componentes React complejos
- 🔸 Custom hooks
- 🔸 Integraciones con APIs externas

### Estructura de Tests

```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  
  beforeEach(async () => {
    // Setup
  });
  
  it('should do X when Y', async () => {
    // Arrange
    const input = { ... };
    
    // Act
    const result = await service.method(input);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.property).toBe(expected);
  });
});
```

Ver más detalles en [ADR-004: Testing Strategy](./docs/adr/ADR-004-testing-strategy.md)

## 🔀 Pull Requests

### Checklist antes de crear PR

- [ ] Tests unitarios añadidos/actualizados
- [ ] Todos los tests pasan (`npm run test`)
- [ ] Linting pasa (`npm run lint`)
- [ ] Sin errores de TypeScript
- [ ] Documentación actualizada si aplica
- [ ] Cambios visuales con screenshots
- [ ] Sin credenciales o secrets commiteados

### Formato del PR

```markdown
## 📝 Descripción
Breve descripción del cambio.

## 🎯 Contexto
¿Por qué se necesita este cambio?

## 🧪 Testing
¿Cómo se probó?

## 📸 Screenshots
(Si aplica)

## ✅ Checklist
- [ ] Tests añadidos
- [ ] Lint pasa
- [ ] TypeScript compilado
```

## 🐛 Reportar Bugs

Al crear un issue, incluir:

1. **Descripción clara** del bug
2. **Pasos para reproducir**
3. **Resultado esperado vs actual**
4. **Screenshots o logs** si aplica
5. **Entorno**: Browser, OS, versión
6. **Datos de prueba** (sin PII)

## 📚 Recursos

- [ADRs](./docs/adr/) - Decisiones arquitectónicas
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Guía de desarrollo
- [AUDITORIA_COMPLETA.md](./AUDITORIA_COMPLETA.md) - Auditoría del proyecto

## 🙋 ¿Preguntas?

- Abre un issue con la etiqueta `question`
- Contacta a los mantenedores del proyecto

---

**¡Gracias por contribuir a Golden Tower ERP! 🏗️**
