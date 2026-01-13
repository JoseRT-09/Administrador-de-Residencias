# Backend - Sistema de Administración de Residencias

API REST desarrollada con Node.js, Express y PostgreSQL.

## Tecnologías

- **Node.js** - Runtime
- **Express** - Framework web
- **PostgreSQL** - Base de datos
- **Sequelize** - ORM
- **JWT** - Autenticación
- **bcryptjs** - Hash de contraseñas

## Configuración Local

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Edita .env con tus configuraciones
```

3. Crear base de datos PostgreSQL:
```sql
CREATE DATABASE residence_management7;
```

4. Ejecutar migraciones:
```bash
npm run migrate
```

5. Iniciar servidor:
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

## Scripts Disponibles

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon
- `npm run migrate` - Ejecuta las migraciones pendientes
- `npm run migrate:undo` - Revierte la última migración

## Despliegue en Render

El proyecto está configurado para desplegarse automáticamente en Render usando el archivo `render.yaml` en la raíz del proyecto.

### Pasos para desplegar:

1. **Crear cuenta en Render**: https://render.com

2. **Crear nuevo servicio**:
   - Conecta tu repositorio de GitHub
   - Render detectará automáticamente el `render.yaml`

3. **Variables de entorno** (se configuran automáticamente):
   - `DATABASE_URL` - Proporcionado por la base de datos PostgreSQL de Render
   - `JWT_SECRET` - Generado automáticamente
   - `CORS_ORIGIN` - URL del frontend en Vercel
   - `NODE_ENV` - production
   - `PORT` - 10000

4. **Base de datos**:
   - Render creará automáticamente una base de datos PostgreSQL
   - Las migraciones se ejecutan automáticamente durante el build

5. **URL de la API**:
   - Una vez desplegado, obtendrás una URL como: `https://residence-management-api.onrender.com`
   - Actualiza esta URL en tu frontend

## Endpoints de la API

- `GET /` - Información de la API
- `GET /health` - Health check
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Login
- `GET /api/users` - Listar usuarios
- `GET /api/residences` - Listar residencias
- `GET /api/payments` - Listar pagos
- `GET /api/reports` - Listar reportes
- `GET /api/complaints` - Listar quejas
- `GET /api/activities` - Listar actividades
- `GET /api/amenities` - Listar amenidades

## Estructura del Proyecto

```
Backend/
├── config/          # Configuración de base de datos
├── migrations/      # Migraciones de Sequelize
├── models/          # Modelos de Sequelize
├── src/
│   ├── controllers/ # Controladores
│   ├── middlewares/ # Middlewares (auth, validators)
│   ├── routes/      # Rutas de la API
│   └── index.js     # Punto de entrada
├── .env.example     # Variables de entorno de ejemplo
├── package.json     # Dependencias
└── README.md        # Este archivo
```

## Seguridad

- Las contraseñas se hashean con bcryptjs
- Autenticación con JWT
- CORS configurado
- Variables sensibles en variables de entorno
- SSL requerido en producción

## Soporte

Para reportar problemas o solicitar características, crea un issue en el repositorio de GitHub.
