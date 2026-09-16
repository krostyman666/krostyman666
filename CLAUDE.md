# Proyectos - Documentación Técnica

## 📋 Descripción General

Este repositorio contiene múltiples proyectos de software desarrollados de forma integrada pero independiente:

1. **Plataforma Inmobiliaria** - Sistema de compraventa sin intermediarios
2. **Ayudante para Declaraciones SII** - Herramienta fiscal
3. **Buscador de Acciones Chilenas** - Análisis de valores bursátiles
4. **Buscador Inmobiliario** - Búsqueda de propiedades

## 🏗️ Estructura de Repositorio

```
/
├── plataforma-inmobiliaria/    # Proyecto principal (MVP)
│   ├── backend/                # API REST (Node + Express + PostgreSQL)
│   ├── frontend/               # Web app (React + Next.js)
│   ├── shared/                 # Tipos y utilidades compartidas
│   ├── infrastructure/         # Docker, deploy configs
│   ├── docs/                   # Documentación del proyecto
│   ├── docker-compose.yml      # Stack de desarrollo local
│   ├── .env.example            # Template de variables
│   ├── .gitignore
│   ├── package.json            # Monorepo workspace
│   └── README.md
├── otros-proyectos/            # (Próximos proyectos)
└── CLAUDE.md                   # Este archivo
```

## 🚀 Plataforma Inmobiliaria - Ejecución

### Setup Inicial

```bash
cd plataforma-inmobiliaria
cp .env.example .env
docker-compose up -d
npm install
npm run migrate -w backend
npm run dev
```

### Stack Tecnológico

| Capa | Tecnología | Version |
|------|-----------|---------|
| **Frontend** | React 18 + Next.js 14 | - |
| **Styling** | Tailwind CSS + PostCSS | - |
| **Backend** | Node.js 18 + Express 4 | - |
| **Database** | PostgreSQL 15 | - |
| **Cache** | Redis 7 | - |
| **Auth** | JWT + NextAuth | - |
| **Firma Digital** | Docusign API | - |
| **Pagos** | Stripe API | - |

### Arquitectura

**Backend Architecture:**
- Routes → Controllers → Services → Database Models
- Middleware para autenticación, validación, manejo de errores
- Redis para caching de consultas frecuentes
- Queue system para tareas asincrónicas

**Frontend Architecture:**
- Pages (Next.js) → Components → Hooks (React Query)
- Tailwind para estilos utilitarios
- React Hook Form para manejo de formularios
- Zod para validación de schemas

### Integraciones Clave

1. **Docusign** - Firma digital de documentos
   - Endpoint: POST /api/documents/sign
   - Webhook para notificaciones de firma

2. **Stripe** - Procesamiento de pagos
   - Endpoint: POST /api/payments/process
   - Webhook para confirmación de pagos

3. **SII** - Validación de datos tributarios
   - Endpoint: GET /api/sii/validate/:rut
   - Cache de 24 horas

### Base de Datos

**Tablas Principales:**
- `users` - Vendedores y compradores
- `properties` - Propiedades publicadas
- `transactions` - Procesos de compraventa
- `documents` - Documentos legales
- `payments` - Historial de pagos

### Variables de Entorno Críticas

```
DATABASE_URL=postgresql://user:pass@host:5432/inmobiliaria
DOCUSIGN_CLIENT_ID=xxx
STRIPE_SECRET_KEY=xxx
JWT_SECRET=xxx
```

## 🧪 Testing y Calidad

```bash
# Tests unitarios
npm run test -w backend
npm run test -w frontend

# Cobertura
npm run test:coverage -w backend

# Linting
npm run lint

# Type checking
npm run type-check
```

## 🔒 Seguridad

- ✅ Encriptación de datos sensibles en tránsito (HTTPS/TLS)
- ✅ Validación de inputs en backend y frontend
- ✅ CORS configurado restrictivamente
- ✅ Rate limiting en endpoints de API
- ✅ Autenticación JWT con refresh tokens
- ✅ Stored procedures para operaciones críticas

## 📊 Métricas de Desarrollo

- **MVP Timeline**: 3 meses
- **Target Launch**: Q1 2027
- **Team Size**: 5 personas iniciales
- **Tech Debt Budget**: 10% de velocidad

## 🔄 CI/CD Pipeline

```
Pull Request → Lint → Type Check → Tests → Deploy Staging
↓
Merge to Main → Build → Tests → Deploy Production
```

## 📚 Documentación Adicional

- `/docs/ARCHITECTURE.md` - Arquitectura detallada
- `/docs/API.md` - Endpoints y payloads
- `/docs/INTEGRACIONES.md` - Guía de integraciones
- `/docs/SETUP.md` - Guía completa de setup

## 🤝 Contribución

1. Crear branch: `feature/descripcion-corta`
2. Commits descriptivos en español
3. Pull request con descripción
4. Code review antes de merge
5. Squash commits en main

## 📞 Contacto y Escalación

- **Issues Técnicos**: Abrir en GitHub
- **Preguntas de Arquitectura**: [owner]
- **Integración Docusign**: [integration lead]
- **Compliance Legal**: [legal contact]

---

**Última Actualización**: 16 Septiembre 2026
**Status**: 🚀 En Desarrollo (Fase 1 - MVP)
