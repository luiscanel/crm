# Teknao CRM - Sistema de Gestión de Ventas B2B

## Descripción

Teknao CRM es un sistema de gestión de ventas B2B con cold calling, seguimiento de leads, gamificación y métricas en tiempo real.

## Características

- **Gestión de Empresas (Leads)**: CRUD completo con estados, seguimiento y teléfono
- **Contactos**: Múltiples contactos por empresa con click-to-WhatsApp
- **Llamadas**: Registro de llamadas con estados, observaciones y puntos
- **Citas**: Agenda de citas con diferentes tipos y estados
- **Gamificación**: Puntos, badges, retos, ranking y premios
- **Dashboard**: Métricas visuales y comparación de rendimiento
- **Roles**: Admin, Supervisor, Vendedor

## Stack Tecnológico

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express + SQLite (sql.js)
- **Despliegue**: Vercel (Frontend), Docker (Backend)

## Estructura del Proyecto

```
b2b/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── api/       # Cliente API
│   │   ├── components/ # Componentes reutilizables
│   │   ├── context/   # Contextos de React
│   │   ├── pages/     # Páginas de la app
│   │   └── App.jsx    # Componente principal
│   ├── vercel.json    # Configuración Vercel
│   └── dist/          # Build de producción
│
└── backend/           # Node.js + Express
    └── src/
        ├── middleware/ # Middleware de autenticación
        ├── models/     # Modelos de datos
        └── routes/     # Rutas API
```

## Instalación Local

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm start
```

## Variables de Entorno

### Backend (para producción)

```env
PORT=3001
JWT_SECRET=tu-clave-secreta-aqui
NODE_ENV=production
```

### Vercel (Frontend)

El frontend en Vercel necesita un backend separado. Configura la variable:

```
VITE_API_URL=https://tu-backend.onrender.com/api
```

## Despliegue en Vercel

1. Sube el código a GitHub
2. Importa el proyecto en Vercel
3. Configura:
   - Framework Preset: Vite
   - Build Command: npm run build
   - Output Directory: dist
4. Despliega

**Nota**: Para el backend, considera usar:
- Render (render.com)
- Railway (railway.app)
- Heroku (heroku.com)

## Credenciales por Defecto

- Admin: `admin@crm.com` / `admin123`
- Vendedor: `vendedor1@crm.com` / `admin123`

## API Endpoints

- `POST /api/auth/login` - Iniciar sesión
- `GET /api/empresas` - Listar empresas
- `POST /api/llamadas` - Registrar llamada
- `GET /api/dashboard/general` - Dashboard
- `GET /api/gamificacion/points` - Puntos del usuario

## Licencia

MIT