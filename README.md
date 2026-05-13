# Jarder — Plataforma de Capacitación Corporativa

## ¿Qué es Jarder?

Jarder es una aplicación web para que empresas creen y gestionen cursos de capacitación para sus empleados. Los administradores pueden diseñar cursos con sesiones de video, documentos y enlaces, y luego evaluar a los trabajadores con exámenes de opción múltiple. Quien aprueba recibe un certificado digital.

Funciona completamente en el navegador: no necesita un servidor backend ni base de datos externa. Todos los datos se guardan en el almacenamiento local del navegador (localStorage e IndexedDB).

## Roles y accesos

### Superadmin
- Gestiona las empresas registradas en la plataforma (CRUD completo).
- Ve todos los empleados de todas las empresas (disponible pero desconectado de navegación).

### Admin
- Gestiona los cursos de su empresa: crea, edita y publica cursos.
- Define sesiones con materiales (video, documentos, enlaces).
- Crea evaluaciones con preguntas de opción múltiple.
- Ve los empleados de su empresa (solo lectura).
- Gestiona los usuarios del sistema para su empresa (cuentas de admin y worker).
- Ve las certificaciones emitidas a los empleados de su empresa.

### Worker (trabajador)
- Navega el catálogo de cursos publicados por su empresa.
- Accede al contenido de cada curso: sesiones con materiales.
- Marca sesiones como completadas.
- Presenta exámenes y obtiene su calificación al instante.
- Descarga/imprime su certificado si aprueba.

## Credenciales de prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `super@jarder.com` | `super123` | Superadmin |
| `admin@empresa.com` | `admin123` | Admin |
| `worker@empresa.com` | `worker123` | Worker |

## Módulos implementados

### Autenticación
- Pantalla de inicio de sesión con email y contraseña.
- Validación contra usuarios semilla almacenados en localStorage.
- Redirección automática según el rol del usuario.
- Guardias de ruta (`authGuard`, `roleGuard`) que protegen cada sección.

### Superadmin
- **Empresas**: listado en tabla, formulario para crear/editar empresa (NIT, dirección, teléfono), confirmación antes de eliminar.

### Admin
- **Cursos**: listado en tabla con estado (Publicado/Borrador), enlace a edición, creación de nuevos cursos, eliminación con confirmación.
- **Edición de curso**: formulario de metadatos (título, descripción, miniatura, publicado), gestión de sesiones (reordenar, añadir, eliminar), gestión de evaluaciones.
- **Edición de sesión**: formulario de título y descripción, gestión de materiales (video por URL, documento, enlace externo, archivo subido con IndexedDB).
- **Edición de evaluación**: formulario de metadatos (título, descripción, nota mínima), gestión de preguntas de opción múltiple con 4 opciones cada una.
- **Empleados**: listado de solo lectura de los empleados de su empresa.
- **Usuarios**: gestión de cuentas de usuario (admin/worker) con email, contraseña y vínculo a empleado.
- **Certificaciones**: listado de certificados emitidos a empleados de su empresa.

### Worker
- **Catálogo**: cuadrícula de cursos publicados por su empresa, cada uno con su título y número de sesiones.
- **Aprendizaje**: panel dividido con lista de sesiones (panel izquierdo) y contenido del material seleccionado (panel derecho). Marcado de sesiones como completadas.
- **Examen**: formulario con preguntas de opción múltiple, calificación instantánea, emisión de certificado al aprobar.
- **Certificado**: vista imprimible con nombre del trabajador, nombre del curso y fecha de emisión.

## Arquitectura del frontend

### Framework y versiones
- **Angular 21** con componentes standalone (sin módulos NgModule).
- **Angular SSR** (Server-Side Rendering) con Express.
- TypeScript 5.9 en modo estricto.

### Almacenamiento de datos
- **localStorage**: todas las entidades (empresas, empleados, cursos, usuarios, certificados, resultados de exámenes) se guardan como JSON en localStorage con claves versionadas (`jarder_*_v1`).
- **IndexedDB**: los archivos subidos por el admin (videos, PDFs) se almacenan via `MaterialBlobStorageService` usando IndexedDB.
- Al iniciar la app por primera vez (localStorage vacío), se siembran datos de ejemplo (3 usuarios, 1 empresa, 1 empleado).

### Routing y guardias
- Las rutas están definidas en `app.routes.ts` con tres secciones principales protegidas por rol:
  - `/superadmin` — solo usuarios con rol `superadmin`
  - `/admin` — solo usuarios con rol `admin`
  - `/worker` — solo usuarios con rol `worker`
- `authGuard` verifica que el usuario haya iniciado sesión.
- `roleGuard` es una fábrica que recibe el rol esperado y redirige al login si no coincide.

### Estado (Signals)
- Todos los servicios usan **Angular Signals** para la reactividad:
  - Los datos se cargan de localStorage en el constructor.
  - Señales privadas contienen los arreglos de datos.
  - Propiedades públicas computadas (`computed`) exponen los datos filtrados/transformados.
  - Los métodos de escritura actualizan la señal y persisten a localStorage.

### Estructura de carpetas

```
src/
├── app/
│   ├── app.component.ts              # Componente raíz
│   ├── app.config.ts                 # Configuración de Angular
│   ├── app.routes.ts                 # Definición de rutas
│   ├── core/                         # Lógica compartida
│   │   ├── components/               # Componentes reutilizables
│   │   │   └── confirm-modal/        # Modal de confirmación
│   │   ├── guards/                   # authGuard, roleGuard
│   │   ├── models/                   # Interfaces de datos
│   │   ├── services/                 # Servicios de datos y lógica
│   │   ├── storage/                  # Almacenamiento de blobs
│   │   └── utils/                    # Utilidades
│   └── features/                     # Módulos funcionales
│       ├── auth/login/               # Inicio de sesión
│       ├── superadmin/               # Panel superadmin
│       │   ├── superadmin-shell/     # Layout con navegación
│       │   ├── superadmin-empresas/  # CRUD empresas
│       │   └── superadmin-empleados/ # CRUD empleados
│       ├── admin/                    # Panel admin
│       │   ├── admin-shell/          # Layout con navegación
│       │   ├── admin-courses/        # Listado de cursos
│       │   ├── admin-course-new/     # Crear curso
│       │   ├── admin-course-edit/    # Editar curso
│       │   ├── admin-session-edit/   # Editar sesión
│       │   ├── admin-evaluation-edit/ # Editar evaluación
│       │   ├── admin-empleados/      # Vista empleados
│       │   ├── admin-usuarios/       # Gestión usuarios
│       │   └── admin-certificaciones/ # Certificaciones
│       └── worker/                   # Panel worker
│           ├── worker-shell/         # Layout con navegación
│           ├── worker-catalog/       # Catálogo de cursos
│           ├── worker-learn/         # Reproductor de curso
│           ├── worker-exam/          # Examen
│           └── worker-certificate/   # Certificado
└── styles.css                        # Sistema de diseño global
```

## Stack técnico

| Tecnología | Uso |
|-----------|-----|
| Angular 21 | Framework frontend |
| Angular SSR | Renderizado del lado del servidor (Express) |
| TypeScript 5.9 | Lenguaje de programación |
| Angular Signals | Estado reactivo |
| Angular Router | Enrutamiento y guardias |
| Angular Forms (ngModel) | Formularios reactivos |
| localStorage | Persistencia de datos |
| IndexedDB | Almacenamiento de archivos |
| CSS Custom Properties | Sistema de diseño dark |
| RxJS | Programación reactiva |

## Modelos de datos

### `UserRole`
Tipo: `'superadmin' | 'admin' | 'worker'`

### `Empresa`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | UUID |
| `nit` | `string` | NIT de la empresa |
| `direccion` | `string` | Dirección |
| `telefono` | `string` | Teléfono |

### `Empleado`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | UUID |
| `empresaId` | `string` | Empresa a la que pertenece |
| `identificacion` | `string` | Número de identificación |
| `tipoIdentificacion` | `'CC' \| 'CE' \| 'TI' \| 'PP'` | Tipo de documento |
| `sexo` | `'M' \| 'F' \| 'O'` | Sexo |
| `telefono` | `string` | Teléfono |
| `nombre` | `string` | Nombre completo |

### `AppUser`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | UUID |
| `email` | `string` | Correo electrónico |
| `displayName` | `string` | Nombre visible |
| `role` | `UserRole` | Rol en el sistema |
| `empresaId` | `string \| null` | Empresa asociada |
| `empleadoId` | `string \| null` | Empleado vinculado |

### `Course`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | UUID |
| `title` | `string` | Título del curso |
| `description` | `string` | Descripción |
| `thumbnailUrl` | `string \| undefined` | URL de miniatura |
| `published` | `boolean` | Publicado en catálogo |
| `empresaId` | `string` | Empresa propietaria |
| `certificacionId` | `string \| null` | ID de certificación asociada |
| `createdAt` | `string` | Fecha de creación (ISO) |
| `updatedAt` | `string` | Fecha de actualización (ISO) |
| `sessions` | `CourseSession[]` | Sesiones del curso |
| `evaluations` | `CourseEvaluation[]` | Evaluaciones del curso |

### `CourseSession`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | UUID |
| `courseId` | `string` | Curso al que pertenece |
| `title` | `string` | Título de la sesión |
| `description` | `string` | Descripción |
| `order` | `number` | Orden dentro del curso |
| `materials` | `CourseMaterial[]` | Materiales de la sesión |

### `CourseMaterial`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | UUID |
| `title` | `string` | Título del material |
| `kind` | `'video' \| 'document' \| 'link'` | Tipo de material |
| `externalUrl` | `string \| undefined` | URL externa |
| `blobId` | `string \| undefined` | Referencia en IndexedDB |

### `CourseEvaluation`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | UUID |
| `courseId` | `string` | Curso al que pertenece |
| `title` | `string` | Título |
| `description` | `string` | Descripción |
| `passingScorePercent` | `number` | Porcentaje mínimo para aprobar |
| `questions` | `EvaluationQuestion[]` | Preguntas del examen |

### `EvaluationQuestion`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | UUID |
| `prompt` | `string` | Enunciado de la pregunta |
| `choices` | `[string, string, string, string]` | 4 opciones de respuesta |
| `correctIndex` | `0 \| 1 \| 2 \| 3` | Índice de la opción correcta |

### `Certificacion`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | UUID |
| `empleadoId` | `string` | Empleado certificado |
| `empresaId` | `string` | Empresa |
| `nombre` | `string` | Nombre del certificado |
| `cursoId` | `string` | Curso asociado |
| `issuedAt` | `string` | Fecha de emisión (ISO) |

## Cómo ejecutar el proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm start
# o bien:
ng serve
```

La aplicación estará disponible en `http://localhost:4200`.

Para construir la versión de producción:

```bash
npm run build
```

Los archivos generados se encuentran en `dist/jarder/`.

## Estado actual

### Completamente funcional
- Inicio de sesión con 3 roles y redirección por rol.
- CRUD completo de empresas (superadmin).
- CRUD completo de cursos, sesiones y materiales (admin).
- CRUD de evaluaciones con preguntas de opción múltiple (admin).
- Catálogo de cursos para trabajadores, filtrado por empresa.
- Reproductor de curso con sesiones y materiales.
- Examen con calificación instantánea y emisión de certificado.
- Certificado imprimible.
- Gestión de usuarios del sistema (admin).
- Sistema de diseño dark completo con tokens CSS.
- Modal de confirmación reutilizable.

### Parcialmente funcional
- El perfil superadmin tiene un componente de empleados (superadmin-empleados) que está creado pero desconectado de la navegación — el superadmin solo gestiona empresas.
- Los archivos subidos por el admin se almacenan en IndexedDB y son funcionales, pero dependen de la capacidad del navegador.

### No implementado / Por conectar
- No hay backend real — todos los datos residen en localStorage y se pierden al limpiar el navegador.
- No hay autenticación real — las contraseñas se validan contra datos en localStorage.
- No hay recuperación de contraseña.
- No hay registro de usuarios (solo el admin puede crear cuentas).
- No hay notificaciones por email.
- No hay reportes ni analytics.
- No hay integración con LMS externos.

## Próximos pasos sugeridos

Para llevar Jarder a producción:

1. **Backend real (API REST)**: Reemplazar localStorage con una API RESTful usando NestJS, Django, o similar.
2. **Autenticación real (JWT)**: Implementar login con tokens JWT, hashing de contraseñas (bcrypt), y refresh tokens.
3. **Base de datos**: Usar PostgreSQL o MongoDB para persistencia real de datos.
4. **Registro de empresas**: Permitir registro público de nuevas empresas con flujo de activación.
5. **Notificaciones**: Enviar emails de bienvenida, notificaciones de curso asignado, y certificados por correo.
6. **Reportes**: Dashboard con estadísticas de progreso, tasas de aprobación, y cursos más vistos.
7. **Subida de archivos real**: Reemplazar IndexedDB con un servicio de almacenamiento en la nube (S3, Cloudinary).
8. **Responsive design**: Adaptar la interfaz para dispositivos móviles.
9. **Pruebas**: Agregar pruebas unitarias y e2e.
10. **Despliegue**: Publicar en Vercel, Netlify o un VPS con Docker.
