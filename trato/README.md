# Trato

Compra y vende propiedades de trato directo, sin corredores.

Te entregamos todos los papeles, escrituras, certificados, impuestos y firmas que
necesita una compraventa en Chile, con asesores en sueldo fijo que muestran la
propiedad. Comisión de 1% + IVA en vez del 2-5% + IVA que cobra un corredor.

## Requisitos

- Node.js 22+
- PostgreSQL 15+ (o Docker)

## Levantar el proyecto

```bash
cp .env.example .env
# Genera el secreto: openssl rand -hex 32  → pégalo en JWT_SECRET
docker compose up -d
npm install
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001

Sin Docker, basta un PostgreSQL local con una base `trato` y ajustar `DATABASE_URL`.

## Comandos

```bash
npm run dev                          # backend + frontend
npm run build                        # compila ambos
npm run lint -w @trato/backend       # lint
npm run type-check -w @trato/frontend
```

## Estructura

```
backend/    Express + Sequelize + PostgreSQL
frontend/   Next.js 16 (App Router) + React 19 + Tailwind
shared/     código compartido entre ambos
```

## Estado

MVP en desarrollo. Listo: landing con calculadora de ahorro, registro y login.
En curso: panel de usuario, publicación y búsqueda de propiedades, wizard de
compraventa con firma electrónica.

Detalle técnico y decisiones de arquitectura en [`../CLAUDE.md`](../CLAUDE.md).
