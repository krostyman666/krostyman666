# Plataforma Inmobiliaria - Compraventa sin Intermediarios

Plataforma de compraventa inmobiliaria automatizada que elimina intermediarios costosos, ofreciendo un proceso legal, transparente y 30-50% más barato que corredores tradicionales.

## 📋 Características MVP

- **Portal de Registro**: Vendedores y compradores pueden registrarse fácilmente
- **Publicación de Propiedades**: Fotos, descripciones, ubicación GPS
- **Búsqueda Avanzada**: Filtros por precio, ubicación, tamaño, amenidades
- **Wizard de Compraventa**: Guía paso a paso del proceso legal
- **Generador de Documentos**: PDFs legales personalizados
- **Firma Digital**: Integración con Docusign para firmas válidas
- **Escrow Seguro**: Manejo seguro de dinero durante la transacción
- **Dashboard**: Seguimiento en tiempo real

## 🏗️ Estructura del Proyecto

```
plataforma-inmobiliaria/
├── backend/              # API REST (Node.js + Express)
├── frontend/             # Web App (React + Next.js)
├── shared/               # Código compartido (tipos, utilidades)
├── infrastructure/       # Docker, scripts de deploy
├── docs/                 # Documentación
├── docker-compose.yml    # Infraestructura de desarrollo
├── .env.example          # Variables de entorno (plantilla)
└── package.json          # Workspace de monorepo
```

## 🚀 Instalación y Setup

### Requisitos Previos
- Node.js 18+
- Docker y Docker Compose
- Git

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/krostyman666/plataforma-inmobiliaria.git
cd plataforma-inmobiliaria
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus valores reales
```

3. **Iniciar servicios con Docker**
```bash
docker-compose up -d
```

4. **Instalar dependencias**
```bash
npm install
```

5. **Ejecutar migraciones de base de datos**
```bash
npm run migrate -w backend
```

6. **Iniciar desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PgAdmin: http://localhost:5050

## 📦 Stack Tecnológico

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Sequelize o TypeORM
- **Base de Datos**: PostgreSQL 15
- **Cache**: Redis 7
- **Validación**: Joi
- **Autenticación**: JWT
- **Testing**: Jest

### Frontend
- **Framework**: React 18
- **Bundler**: Next.js 14
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Query
- **Form Validation**: React Hook Form
- **Testing**: Vitest

### Integraciones
- **Firma Digital**: Docusign API
- **Pagos**: Stripe API
- **Email**: SMTP / SendGrid
- **Almacenamiento**: AWS S3
- **SII**: API de Impuestos Internos

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en watch mode
npm run test:watch
```

## 📝 Documentación

Consulta la carpeta `docs/` para:
- Arquitectura técnica
- Flujos de usuario
- API endpoints
- Integración con APIs externas
- Guía de contribución

## 🔒 Seguridad

- Encriptación end-to-end para documentos
- Autenticación multi-factor (MFA)
- Validación de inputs en frontend y backend
- Rate limiting en APIs
- HTTPS/TLS en producción
- Compliance con regulaciones chilenas

## 🤝 Contribución

Ver `docs/CONTRIBUTING.md` para guidelines de contribución.

## 📄 Licencia

Privado - Todos los derechos reservados

## 👥 Equipo

- **Product Manager**: [nombre]
- **Lead Backend**: [nombre]
- **Lead Frontend**: [nombre]
- **Legal/Compliance**: [nombre]

## 📞 Contacto

Para preguntas o sugerencias: contact@plataformainmobiliaria.cl

---

**Status**: 🚀 En Desarrollo MVP (Fase 1)
