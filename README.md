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