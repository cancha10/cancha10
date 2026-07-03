# Cómo aplicar este fix (c10-backend-v10)

## Qué arregla

El error "Error del servidor" al crear un paquete nuevo. Causa: a la tabla
`paquetes` en la base de datos le faltaban las columnas `precio_sesion`,
`tipo_cobro`, `tipo`, `horas_semana` o `activo` (el código las usa pero la DB
de producción nunca las recibió).

## Qué se cambió respecto a v9

1. **Nuevo archivo**: `src/config/migrate.js`
   Agrega las columnas faltantes automáticamente (idempotente — solo agrega
   si no existen, no borra ni cambia datos).

2. **`src/index.js`**: llama a `runAutoMigrations()` al arrancar el servidor.

3. **`src/controllers/inscripcionesController.js`**: ahora devuelve el
   mensaje real del error en vez de "Error del servidor" genérico, para que
   futuros problemas sean visibles.

## Cómo instalar (paso a paso)

1. Descarga `c10-backend-v10.zip` y descomprímelo.
2. **Sustituye toda la carpeta del backend** por esta nueva.
   (Tu archivo `.env` con la URL de la base de datos NO está dentro del zip;
   conserva el `.env` que ya tienes.)
3. En la carpeta del backend ejecuta:
   ```
   npm install
   ```
4. Haz deploy como siempre (push a Railway/Render/etc.).
5. Al primer arranque verás en los logs:
   ```
   ✅ Migraciones automáticas aplicadas (paquetes OK)
   ```
6. Vuelve a la app y crea el paquete. Debería funcionar.

## El frontend NO necesita cambios

Tu `c10-frontend-v12` está bien; el bug era 100% del backend/base de datos.
