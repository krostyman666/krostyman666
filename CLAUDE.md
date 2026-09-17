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
| Publicar propiedad + expediente de documentos | Listo, probado en navegador |
| Búsqueda pública `/propiedades` con filtros | Listo, probado en navegador |
| Ficha pública `/propiedades/:id` con galería y mapa | Listo, probado en navegador |
| Agendamiento de visitas (disponibilidad + cupos + reserva) | Listo, probado en navegador |
| Agenda del asesor y asignación por comuna | Listo, probado en navegador |
| Notaría como actor: bandeja y validación | Listo, probado en navegador |
| Bot de preguntas del comprador | Pendiente — decisión de alcance abierta |
| Informe pagado del inmueble | Pendiente — decisión de fuentes y SLA abierta |
| Promesa, compraventa y firma | Pendiente |
| Subida de archivos de documentos | Pendiente |
| Integraciones externas | Pendiente — ver doc de integraciones |

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
- **Mapa con iframe de OpenStreetMap**, sin dependencia ni API key. Alcanza para
  mostrar el sector; cuando se decida proveedor (Google cobra y pide llave) se
  reemplaza `MapaPropiedad` y nada más.
- **El filtro de precio se ancla a una moneda.** `precio` guarda el número sin
  la moneda, así que un rango suelto mezclaría UF con pesos. El arreglo de
  verdad es una columna normalizada; mientras no exista, el rango asume UF.
- **El lint del frontend corría vacío**: `next lint` ya no existe en Next 16 y
  el `eslint.config.js` pasaba los configs de `eslint-config-next` por
  `FlatCompat`, que revienta. Ahora se extienden directo y `npm run lint` es
  `eslint src`. Al encenderlo apareció `react-hooks/set-state-in-effect` en
  todo el proyecto: quedó en `warn` porque la salida es mover las cargas a
  react-query (ya está en las dependencias, sin usar), no un disable por archivo.

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

## El dominio: expediente de documentos

`backend/src/dominio/documentos.catalogo.ts` es el núcleo del producto. Define
los documentos de una compraventa chilena con emisor, responsable, etapa y
vigencia. Al crear una propiedad se genera su expediente completo en la misma
transacción, filtrado por las condiciones del caso (departamento suma gastos
comunes; propiedad hipotecada suma el alzamiento; compra con crédito suma
tasación y aprobación).

Un documento tiene **dos ejes independientes**: `estado` (si tenemos el papel) y
`validacion` (si la notaría lo revisó). `conforme` exige los tres: recibido,
vigente y aprobado. Contar solo `recibido` como "listo" es un error: el vendedor
puede tener todos los papeles y aun así no poder escriturar.

Cuatro reglas que no son obvias y conviene no romper:

- **Los certificados vencen.** Dominio vigente y gravámenes duran ~30 días. Si
  la operación se alarga caducan antes de firmar y hay que pedirlos de nuevo.
  Esa fricción es la que la plataforma existe para absorber, así que el
  vencimiento se calcula y se muestra, no se esconde.
- **La escritura pública no se automatiza.** Por ley chilena va ante notario.
  El sistema la orquesta; nunca la presentes como firma electrónica.
- **Reemplazar un documento anula su aprobación.** Está como hook `beforeUpdate`
  en el modelo, no en el servicio, para que no dependa de por dónde entre el
  cambio. Sin eso se podía hacer aprobar un papel y cambiarlo después.
- **Observar exige motivo.** Una observación sin explicación deja al vendedor
  bloqueado sin saber qué corregir.

Los plazos de vigencia del catálogo llevan advertencia en el archivo: hay que
confirmarlos con abogado antes de producción.

## La ficha pública y el límite con el expediente

`GET /propiedades/:id` no lleva sesión, así que devuelve `obtenerPublica`: sin
documentos, sin foja/número/año de inscripción y sin rol de avalúo. Antes servía
el expediente completo, lo que exponía al vendedor y además regalaba lo que el
comprador debería pagar en el informe. `/:id/informe` exige sesión y pasa por
`exigirAccesoAlExpediente`: dueño, notaría a cargo de esa operación, o equipo
interno. Un comprador no, ni con sesión.

La dirección exacta tampoco va en la ficha. `MapaPropiedad` dibuja un círculo de
sector y sólo marca el punto con `exacta`, que se usa una vez confirmada la
visita: si el número va en la página pública, cualquiera llega al vendedor por
fuera y la plataforma no cobra por lo que hizo.

## Visitas

El vendedor declara ventanas semanales (`disponibilidad_visitas`, hora de pared
chilena). De ahí salen cupos de 45 minutos cada 60, y esos 15 de diferencia son
el traslado del asesor: por eso los cupos de una misma propiedad quedan pegados.

Cuatro cosas que conviene no romper:

- **Las horas se calculan pasando por `America/Santiago`**, en
  `backend/src/utils/tiempo.ts`. Chile cambia de horario en septiembre y abril;
  armar el instante con `new Date(ano, mes, dia, hora)` corre las visitas una
  hora dos veces al año, y sólo las que caen del otro lado del salto.
- **Reservar toma la fila de la propiedad con `lock: t.LOCK.UPDATE`.** Sin eso
  dos compradores que aprietan a la vez quedan con la misma hora y el asesor
  descubre el choque en la calle.
- **La agenda del asesor va en orden cronológico, no agrupada por comuna.** La
  hora ya la eligió el comprador y no se puede mover: ordenar por zona produce
  un recorrido imposible (Ñuñoa 12:00 y después Providencia 10:00). Lo que se
  optimiza es la asignación —`porAsignar` agrupa por comuna y día, los grupos
  grandes primero— y `saltosDeComuna` mide cuánto cruza de zona ese día.
- **`inicio` es un instante UTC.** Recortar `inicio.slice(0, 10)` para sacar el
  día muestra el día UTC: una visita de las 21:00 en Chile aparecería al día
  siguiente. En el frontend eso es `formatearDiaDeInstante`.

## API

```
GET   /health
GET   /api/v1

POST  /api/v1/auth/registro   { email, password, nombre, apellido, rut, telefono?, rol }
POST  /api/v1/auth/ingreso    { email, password }        → { token, usuario }
GET   /api/v1/auth/perfil     Bearer                     → { usuario }

GET   /api/v1/propiedades                    ?comuna&tipo&moneda&precioMin&precioMax&dormitoriosMin&pagina
GET   /api/v1/propiedades/mias               Bearer
POST  /api/v1/propiedades                    Bearer
GET   /api/v1/propiedades/:id                ficha pública, sin expediente
PATCH /api/v1/propiedades/:id                Bearer (solo el dueño)
PATCH /api/v1/propiedades/:id/estado         Bearer (solo el dueño)
GET   /api/v1/propiedades/:id/informe        Bearer (dueño, su notaría o interno)
PATCH /api/v1/propiedades/documentos/:docId  Bearer (solo el dueño)
PATCH /api/v1/propiedades/:id/notaria        Bearer (solo el dueño)
GET   /api/v1/propiedades/:id/listo-para-escriturar   Bearer
GET   /api/v1/propiedades/catalogo-documentos

GET   /api/v1/propiedades/:id/cupos          → dias[{ dia, cupos[{ inicio, fin }] }]
GET   /api/v1/propiedades/:id/disponibilidad
PUT   /api/v1/propiedades/:id/disponibilidad Bearer (solo el dueño)  { bloques }
POST  /api/v1/propiedades/:id/visitas        Bearer  { inicio, mensaje? }
GET   /api/v1/propiedades/:id/visitas        Bearer (solo el dueño)

GET   /api/v1/visitas/mias                   Bearer
GET   /api/v1/visitas/agenda                 Bearer, rol asesor  ?dia=2026-09-19
GET   /api/v1/visitas/por-asignar            Bearer, rol asesor
PATCH /api/v1/visitas/:id/asesor             Bearer, rol asesor   { asesorId }
PATCH /api/v1/visitas/:id/cancelar           Bearer (comprador o vendedor)
PATCH /api/v1/visitas/:id/resultado          Bearer, rol asesor   { estado }

GET   /api/v1/notarias                       ?tipo=notaria|conservador&comuna
GET   /api/v1/notarias/bandeja               Bearer, rol notaria
PATCH /api/v1/notarias/documentos/:docId/validacion   Bearer, rol notaria
```

Datos de prueba de notarías: `npx ts-node --transpile-only src/scripts/seed-socios.ts`
desde `trato/backend`. Crea dos notarías con usuario (clave `clave-notaria-1`).
Los nombres son ficticios: al incorporar oficinas reales hay que cargarlas desde
su nómina oficial.

## Verificación antes de dar algo por listo

```bash
npm run type-check -w @trato/backend && npm run type-check -w @trato/frontend
npm run lint -w @trato/backend && npm run lint -w @trato/frontend
npm run build -w @trato/backend && npm run build -w @trato/frontend
```

Para cambios de UI: levantar y mirarlo en el navegador, no sólo compilar.

## Documentos de estrategia

- Hub de proyectos: https://claude.ai/code/artifact/daf59f43-87df-4136-81f5-40a717d8298e
- Plan técnico: https://claude.ai/code/artifact/76d11eac-7f10-4019-b112-dc725aea9c6a
- Estrategia comercial: https://claude.ai/code/artifact/7caf8be7-315c-479f-8df5-6b7ab08ff35c
- Integraciones (qué se puede conectar y qué no): https://claude.ai/code/artifact/a4639f81-e2af-4945-8150-43bd4a1970ca
