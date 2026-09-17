# Trato

Compraventa de propiedades de trato directo en Chile. Reemplaza al corredor:
1% + IVA en vez de 2-5% + IVA, con todos los papeles, certificados, impuestos y
firmas gestionados por la plataforma.

**Marca**: Trato. Elegida porque "trato directo" ya es la frase que usan los avisos
chilenos para decir "sin corredor" — la marca explica el producto y captura esa búsqueda.

## Estado actual

| Pieza | Estado |
|---|---|
| Landing con calculadora de ahorro | Listo, verificado en navegador |
| Registro (UI + API + BD) | Listo, flujo end-to-end probado |
| Login (UI + API) | Listo, probado en navegador |
| Panel `/panel` con guard de sesión | Listo, probado en navegador |
| Publicar/buscar propiedades | Pendiente |
| Wizard de compraventa, Docusign, pagos | Pendiente |

## Estructura

```
trato/
├── backend/    API REST — Express 4 + Sequelize 6 + PostgreSQL
├── frontend/   Next.js 16 (App Router) + React 19 + Tailwind 3
├── shared/     vacío; se cablea cuando haya un 2º módulo compartido
├── infrastructure/
└── docker-compose.yml   Postgres 15 + Redis 7
```

## Correr el proyecto

```bash
cd trato
cp .env.example .env          # JWT_SECRET: openssl rand -hex 32
docker compose up -d          # o Postgres local en :5432, base "trato"
npm install
npm run dev                   # backend :3001 + frontend :3000
```

En desarrollo el backend hace `sequelize.sync({ alter: true })`; en producción
hay que pasar a migraciones antes del primer deploy.

## Decisiones tomadas

- **Next 16 / React 19 / ESLint 9 (flat config)**: proyecto nuevo, sin nada que
  migrar, y cerró un CVE crítico de Next. `npm audit` queda en 0 vulnerabilidades
  salvo `uuid` (moderada, transitiva de Sequelize, ruta `buf` que no usamos).
- **RUT duplicado en `backend/src/utils/rut.ts` y `frontend/src/lib/rut.ts`**: el
  módulo 11 está fijado por ley y no cambia. Se mueve a `shared/` cuando aparezca
  el segundo módulo compartido (probablemente tipos de propiedad o estados de
  transacción).
- **`.env` en la raíz del monorepo**; `backend/src/config/env.ts` lo carga por ruta
  y falla al arrancar si falta `DATABASE_URL` o `JWT_SECRET`.
- **Calculadora sólo compara comisión de corretaje.** Notaría, Conservador e
  hipotecario se mencionan pero no se estiman: no inventamos cifras legales.
- **UF**: `UF_FALLBACK_CLP` en `frontend/src/lib/comision.ts` es un placeholder.
  Conectar a mindicador.cl antes de producción.

## Seguridad (implementado)

- bcrypt cost 12; `passwordHash` nunca sale en respuestas (`Usuario.toJSON`)
- JWT firmado con issuer `trato`, expira en 7d
- Login compara contra un hash señuelo si el email no existe → no revela qué
  correos están registrados, ni por mensaje ni por tiempo de respuesta
- Rate limit 10 intentos / 15 min en `/registro` y `/ingreso`. El contador vive en
  memoria del proceso: sirve para una instancia, pero al escalar a varias hay que
  moverlo a Redis (ya está en docker-compose) o los límites se multiplican por
  instancia. Además registro e ingreso comparten presupuesto por IP.
- Validación Joi (backend) + Zod (frontend), RUT verificado en ambos lados
- helmet, CORS restringido a `FRONTEND_URL`

## API

```
GET  /health
GET  /api/v1
POST /api/v1/auth/registro   { email, password, nombre, apellido, rut, telefono?, rol }
POST /api/v1/auth/ingreso    { email, password }        → { token, usuario }
GET  /api/v1/auth/perfil     Authorization: Bearer ...  → { usuario }
```

## Verificación antes de dar algo por listo

```bash
npm run type-check -w @trato/backend && npm run type-check -w @trato/frontend
npm run lint -w @trato/backend
npm run build -w @trato/backend && npm run build -w @trato/frontend
```

Para cambios de UI: levantar y mirarlo en el navegador, no sólo compilar.

## Documentos de estrategia

- Hub de proyectos: https://claude.ai/code/artifact/daf59f43-87df-4136-81f5-40a717d8298e
- Plan técnico: https://claude.ai/code/artifact/76d11eac-7f10-4019-b112-dc725aea9c6a
- Estrategia comercial: https://claude.ai/code/artifact/7caf8be7-315c-479f-8df5-6b7ab08ff35c
