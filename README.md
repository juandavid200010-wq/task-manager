# Task Manager

Aplicación web SPA de gestión de tareas, desarrollada como Proyecto Integrador 4. Permite a los usuarios registrarse, iniciar sesión, gestionar sus tareas de forma persistente en la nube, y recibir un resumen de sus tareas por correo electrónico.

## Stack tecnológico

- **Frontend:** React + TypeScript + Vite
- **Backend as a Service:** Firebase (Authentication + Firestore)
- **Notificaciones:** AWS SES (a través de una función serverless)
- **Deploy:** Vercel
- **Testing:** Vitest + React Testing Library

## Demo en producción

🔗 [https://task-manager-two-pi-14.vercel.app](https://task-manager-two-pi-14.vercel.app)

## Funcionalidades

- Registro e inicio de sesión con correo/contraseña o Google.
- Rutas protegidas: solo usuarios autenticados pueden ver sus tareas.
- CRUD completo de tareas (crear, editar, eliminar, marcar como completada).
- Sincronización en tiempo real con Firestore (`onSnapshot`).
- Cada usuario solo puede ver y modificar sus propias tareas (reglas de seguridad de Firestore).
- Envío de resumen de tareas por email mediante AWS SES.

## Cómo correr el proyecto localmente

### 1. Clonar el repositorio

```bash
git clone https://github.com/juandavid200010-wq/task-manager.git
cd task-manager
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

Copia `.env.example` a `.env` y completa los valores:

```bash
cp .env.example .env
```

Necesitas:
- Credenciales de un proyecto de Firebase (Authentication + Firestore habilitados).
- Credenciales de un usuario IAM de AWS con permisos de SES (`AmazonSESFullAccess`).
- Un correo verificado en AWS SES (ver nota sobre modo sandbox más abajo).

### 4. Correr el servidor de desarrollo

```bash
pnpm run dev
```

La app frontend corre en `http://localhost:5173`. Nota: las funciones serverless de `api/` (el envío de email) **no** funcionan con `pnpm run dev` — requieren Vercel CLI (`vercel dev`) o probarse directamente en producción.

### 5. Correr los tests

```bash
pnpm run test
```

## Nota importante: AWS SES en modo sandbox

Esta aplicación usa AWS SES en **modo sandbox** (el modo por defecto para cuentas nuevas de AWS). En este modo, SES solo puede enviar correos **a direcciones verificadas** en la consola de AWS — no a cualquier destinatario.

Esto significa que, para probar el envío de resumen por email, el correo del usuario logueado debe estar verificado en Amazon SES (Verified identities). Salir del modo sandbox requiere solicitar acceso de producción a AWS, un trámite que no era necesario para el alcance de este proyecto académico.

## Estructura del proyecto

src/
├─ pages/ # Vistas (Login, Register, Tasks)
├─ components/ # Componentes UI (TaskForm, TaskList)
├─ features/ # Lógica por dominio (auth)
├─ services/ # Integraciones (Firebase, tareas, email)
├─ routes/ # Rutas privadas (ProtectedRoute)
├─ hooks/ # Hooks (useAuth, useTasks)
├─ types/ # Tipos e interfaces compartidas
└─ tests/ # Tests de componentes

api/ # Función serverless (envío de email con SES)


## Seguridad

- Las credenciales de Firebase y AWS se manejan como variables de entorno, nunca hardcodeadas en el código.
- `.env` está excluido del repositorio (`.gitignore`); `.env.example` sirve como plantilla.
- Las reglas de seguridad de Firestore impiden que un usuario acceda a las tareas de otro (verificado explícitamente con dos usuarios de prueba).
- Las credenciales de AWS solo existen en el entorno del servidor (función serverless), nunca en el frontend.


## Decisiones de arquitectura

- **Separación por capas.** Los componentes (`components/`, `pages/`) solo describen qué se muestra. La lógica de negocio vive en hooks (`useAuth`, `useTasks`) y las llamadas a servicios externos en `services/` (Firebase y la API de email). Así los componentes se pueden probar con mocks, sin tocar Firebase.
- **Estado de autenticación con Context API.** `AuthProvider` se suscribe a `onAuthStateChanged` y comparte `user` y `loading` con toda la app. El estado `loading` evita que `ProtectedRoute` redirija al login antes de que Firebase confirme si hay sesión.
- **Tiempo real con `onSnapshot`.** `useTasks` se suscribe a las tareas del usuario y cancela la suscripción al desmontarse el componente, para evitar fugas de memoria.
- **Tipado.** La interfaz `Task` y `AuthContextType` están en `types/`. Los errores de Firebase se traducen a mensajes comprensibles en `utils/authErrors.ts`.
- **Email en una función serverless.** El envío con AWS SES no puede hacerse desde el navegador porque expondría las credenciales de AWS. El frontend llama a `/api/send-summary`, y solo esa función, en el servidor, usa las credenciales.
- **Rutas SPA en Vercel.** `vercel.json` redirige cualquier ruta que no sea `/api/...` a `index.html`, para que recargar o entrar directo a `/tasks` funcione.

## Reglas de seguridad de Firestore

Cada tarea guarda el `userId` de su dueño. Las reglas solo permiten operar sobre documentos cuyo `userId` coincide con el usuario autenticado:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

- Un usuario no autenticado no puede leer ni escribir nada.
- Al crear una tarea, el `userId` del documento debe ser el del usuario que la crea, así nadie puede crear tareas a nombre de otro.
- Esto se verificó con dos usuarios distintos: el segundo usuario no ve las tareas del primero.
- La consulta (`where userId == uid` ordenada por `createdAt`) requiere un índice compuesto en Firestore: colección `tasks`, `userId` ascendente y `createdAt` descendente.

## Integración con AWS SES

Flujo del envío del resumen:

1. El usuario pulsa **Enviar resumen por email**.
2. El frontend obtiene el token de sesión de Firebase (`user.getIdToken()`) y lo envía a `/api/send-summary` en el encabezado `Authorization: Bearer <token>`, junto con la lista de tareas.
3. La función serverless valida el token con la API de Firebase. Si es inválido, responde 401.
4. El destinatario del correo es el email del usuario autenticado, tomado del token. El cliente no puede elegirlo, por lo que nadie puede usar la función para escribirle a un tercero.
5. Se validan los datos recibidos (lista de máximo 200 tareas, título de texto de 1 a 200 caracteres, `completed` booleano) y el título se escapa antes de insertarlo en el HTML del correo.
6. La función envía el correo con AWS SES usando credenciales que solo existen como variables de entorno del servidor.

El envío fue probado en producción y el correo con el resumen llegó correctamente.

### Variables de entorno

| Variable | Dónde se usa |
| --- | --- |
| `VITE_FIREBASE_*` (API key, auth domain, project id, storage bucket, messaging sender id, app id, measurement id) | Frontend |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | Función serverless |
| `SES_FROM_EMAIL` | Función serverless (remitente verificado en SES) |

## Reflexión sobre el uso de inteligencia artificial

Usé Claude (Anthropic) como asistente durante todo el proyecto, y en algún momento también consulté a Gemini.


**Cómo verifiqué el código generado.**
- Ejecuté los tests (15 pruebas con Vitest y Testing Library) y probé cada funcionalidad a mano en el navegador.
- Comprobé el aislamiento de datos entre usuarios con dos cuentas distintas.
- Probé el flujo completo en producción: registro, login, CRUD, edición y envío del email.
- Cuando algo falló, leí el error real (índice de Firestore, versión de Node en Vercel, dominio no autorizado para el login con Google) en lugar de aceptar el primer arreglo.

**Qué aprendí.** Que las credenciales sensibles nunca deben llegar al navegador y por qué la variable lleva el prefijo `VITE_` o no; que `onSnapshot` necesita cancelarse al desmontar; que Firestore pide índices compuestos para ciertas consultas; que SES en modo sandbox solo envía a correos verificados; y que una función serverless debe autenticar a quien la llama.

