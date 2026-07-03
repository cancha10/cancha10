# 🎾 C10 Backend — API de Cancha 10

API REST para gestión de alumnos, clases, reservaciones, asistencia y pagos de la Academia de Tenis Cancha 10.

---

## Stack

- **Node.js** + **Express** — servidor y rutas
- **PostgreSQL** — base de datos
- **JWT** — autenticación
- **bcryptjs** — hash de contraseñas

---

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus datos de PostgreSQL y JWT secret

# 3. Crear la base de datos
psql -U postgres -c "CREATE DATABASE c10_db;"
psql -U postgres -c "CREATE USER c10_user WITH PASSWORD 'tu_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE c10_db TO c10_user;"

# 4. Ejecutar el esquema SQL
psql -U c10_user -d c10_db -f c10_schema.sql

# 5. Arrancar el servidor
npm run dev     # desarrollo (con nodemon)
npm start       # producción
```

---

## Endpoints principales

### Auth
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| POST | `/api/auth/login` | Iniciar sesión | Público |
| POST | `/api/auth/register` | Registrar usuario | Admin |
| GET  | `/api/auth/me` | Mi perfil | Autenticado |
| POST | `/api/auth/cambiar-password` | Cambiar contraseña | Autenticado |

### Alumnos
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET  | `/api/alumnos` | Lista todos los alumnos | Admin/Instructor |
| GET  | `/api/alumnos/:id` | Detalle de un alumno | Admin/Instructor |
| PUT  | `/api/alumnos/:id` | Actualizar alumno | Admin |
| GET  | `/api/alumnos/:id/asistencia` | Historial de asistencia | Admin/Instructor |

### Clases y Sesiones
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET  | `/api/clases` | Horario semanal completo | Autenticado |
| GET  | `/api/sesiones?fecha=YYYY-MM-DD` | Sesiones de un día | Autenticado |
| GET  | `/api/sesiones/:id/alumnos` | Alumnos de una sesión | Admin/Instructor |
| POST | `/api/sesiones/:id/asistencia` | Registrar asistencia | Admin/Instructor |
| PATCH| `/api/sesiones/:id/cancelar` | Cancelar sesión | Admin |

### Reservaciones
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| POST   | `/api/reservaciones` | Crear reserva | Alumno |
| DELETE | `/api/reservaciones/:id` | Cancelar reserva | Alumno/Admin |
| GET    | `/api/reservaciones/mis-reservas` | Mis próximas reservas | Alumno |

### Inscripciones y Paquetes
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET  | `/api/paquetes` | Catálogo de paquetes | Autenticado |
| GET  | `/api/inscripciones` | Todas las inscripciones | Admin |
| POST | `/api/inscripciones` | Nueva inscripción | Admin |
| PATCH| `/api/inscripciones/:id/renovar` | Renovar un mes | Admin |

### Pagos
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET  | `/api/pagos` | Todos los pagos | Admin |
| POST | `/api/pagos` | Registrar pago | Admin |
| GET  | `/api/pagos/pendientes` | Alumnos sin pagar este mes | Admin |
| GET  | `/api/pagos/mis-pagos` | Mi historial de pagos | Alumno |
| PATCH| `/api/pagos/:id` | Actualizar estado de pago | Admin |

---

## Roles del sistema

| ID | Rol | Permisos |
|----|-----|----------|
| 1 | admin | Acceso total |
| 2 | instructor | Ver y registrar asistencia |
| 3 | alumno | Reservar, ver sus datos |

---

## Ejemplo de login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@cancha10.mx", "password": "tu_password"}'
```

Respuesta:
```json
{
  "token": "eyJhbGci...",
  "usuario": {
    "id": "uuid...",
    "nombre": "Roberto",
    "apellido": "Estrada",
    "email": "admin@cancha10.mx",
    "rol": "admin"
  }
}
```

Usa el token en todas las peticiones protegidas:
```bash
Authorization: Bearer eyJhbGci...
```
