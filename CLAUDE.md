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
| Visita individual u open house, a elección del vendedor | Listo, probado en navegador |
| Agenda del asesor y asignación por comuna | Listo, probado en navegador |
| Notaría como actor: bandeja y validación | Listo, probado en navegador |
| Informe nivel gratis (antecedentes) | Listo, probado en navegador |
| Informe nivel pagado: pedido, firma de abogado, entrega | Listo salvo el cobro |
| Consentimiento del vendedor para divulgar antecedentes | Listo, probado en navegador |
| Modelo de rentabilidad por venta cerrada (`/economia`, admin) | Listo, probado en navegador |
| Cobro del informe pagado | Pendiente — hoy se pide y se cobra fuera de la plataforma |
| Derechos del titular y plazos de conservación (Ley 21.719) | Pendiente — exigible desde el 1-dic-2026 |
| Conexión a SII y Tesorería para avalúo y contribuciones | Pendiente |
| Bot de preguntas del comprador | Pendiente |
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

`GET /propiedades/:id` pasa por `autenticarOpcional`: sin sesión devuelve
`obtenerPublica` —sin documentos, sin foja/número/año de inscripción y sin rol
de avalúo— y al dueño o al equipo interno les devuelve la ficha completa, para
que pueda abrir su propia propiedad en borrador sin recibir un 404. Antes servía
el expediente a cualquiera, lo que exponía al vendedor y además regalaba lo que
el comprador debería pagar en el informe. `/:id/informe` sí exige sesión y pasa
por `exigirAccesoAlExpediente`: dueño, notaría a cargo de esa operación, o
equipo interno. Un comprador no, ni con sesión.

La dirección exacta tampoco va en la ficha. `MapaPropiedad` dibuja un círculo de
sector y sólo marca el punto con `exacta`, que se usa una vez confirmada la
visita: si el número va en la página pública, cualquiera llega al vendedor por
fuera y la plataforma no cobra por lo que hizo.

## El informe en dos niveles

`backend/src/dominio/informe.catalogo.ts` define qué trae cada nivel. Los dos
niveles no son una táctica comercial: salen de que las fuentes se comportan
distinto. El avalúo del SII sale gratis y al instante con el rol; los
certificados del Conservador hay que comprarlos y esperarlos, porque son cerca
de 300 oficinas independientes por territorio y casi ninguna publica servicio
digital. Por eso el nivel pagado promete días hábiles y no inmediatez.

Tres límites legales que el código ya respeta y que no conviene aflojar:

- **Estudio de títulos sólo con firma de abogado.** La pauta del Colegio de
  Abogados exige conclusión, detalle de los defectos, fecha, firma y datos del
  abogado, que responde por lo que sostiene. Mientras no haya firma, el nivel
  pagado se llama "carpeta de títulos"; el nombre lo decide `nombreDelNivel` a
  partir de `firmadoEn`, no una constante que alguien pueda cambiar sin pensar.
  Por lo mismo existe el rol `abogado`: sin él no se distingue una firma válida
  de cualquier usuario apretando el botón.
- **El nivel gratis dice qué no es.** La Ley 19.496 sanciona la publicidad
  engañosa con hasta 1500 UTM, y engañosa incluye inducir a error por omisión o
  ambigüedad. `LIMITES_ANTECEDENTES` se muestra completo dentro del informe y
  resumido en la oferta, nunca en letra chica.
- **Los datos del vendedor necesitan base de licitud.** La Ley 21.719 entra en
  plena vigencia el 1 de diciembre de 2026 y terminó con el atajo que servía
  acá: bajo la Ley 19.628 bastaba que el dato estuviera en una fuente de acceso
  público. Ya no. Que la inscripción del Conservador sea pública no habilita por
  sí solo a republicarla en algo que vendemos. La base que usamos es el
  consentimiento del vendedor, guardado en `consentimientos` con la versión del
  texto que aceptó, la fecha y la IP: lo que se fiscaliza es evidencia fechada,
  no un booleano. Las secciones con `requiereConsentimiento` salen vacías y con
  el motivo a la vista si no hay autorización vigente.

Dos cosas más del diseño:

- **El informe es una foto, no una vista.** `Informe.contenido` guarda lo
  entregado y no se recalcula al abrirlo. Los certificados del Conservador
  vencen a los 30 días en la práctica bancaria, así que un informe regenerado
  mostraría datos distintos de los que el comprador usó para ofertar. Como esas
  fotos son inmutables y viven para siempre, el renderizador del frontend tiene
  que aguantar formas que ya no emitimos.
- **Fuente sin conectar se dice, no se inventa.** El avalúo y las contribuciones
  salen hoy con "fuente por conectar" en vez de un número plausible. El comprador
  va a decidir una compra con esto.

Los montos del catálogo son del Conservador de Santiago ($13.500 la carpeta de
10 años) y cambian por territorio. El precio de venta es un placeholder en
`PRECIO_INFORME_TITULOS_CLP`, como `UF_FALLBACK_CLP`: se congela en cada informe
al pedirlo, así que cambiarlo no altera lo ya cobrado.

## Rentabilidad

`backend/src/dominio/economia.ts` calcula qué deja una venta cerrada. El negocio
cobra 1% donde el corredor cobra 2 a 5, y paga sueldos fijos donde el corredor
paga comisión: esa apuesta sólo funciona si atender una propiedad cuesta poco y
de forma predecible.

**Todo se calcula por venta cerrada, no por publicación.** Una publicación que no
vende igual consumió visitas y sueldo, así que con 25% de cierre cada venta paga
las visitas de cuatro publicaciones. Dividir por publicación da un margen que no
existe, y es el error que hunde a las corredoras que crecen.

Lo que el modelo dejó a la vista con los supuestos por defecto:

- A UF 8.400 el margen es cómodo, pero **bajo ~UF 1.500 la operación pierde
  plata**: con 1% de comisión una propiedad barata no alcanza a pagar las visitas
  que consumió. Ahí hay que cobrar distinto o no tomar la operación.
- **El informe de títulos se vende bajo costo** con el placeholder actual: cuesta
  ~$71.000 entre el tiempo del abogado y la carpeta del Conservador, y está
  puesto en $49.000. El modelo sugiere ~$103.000.
- **El cuello de botella son los asesores, no los abogados.** Un abogado alcanza
  para el doble de ventas que un asesor, así que el próximo cargo a llenar es
  asesor.
- **El costo del equipo va a subir solo.** El aporte previsional de cargo del
  empleador quedó en 3,5% desde agosto de 2026 y sube por gradualidad hasta 8,5%
  en agosto de 2033 (Ley 21.735). Un modelo de sueldos fijos tiene que mirar esa
  curva.

Los sueldos y el costo empresa están investigados y llevan fuente en
`FUENTES_SUPUESTOS`. Los del embudo —visitas por publicación, tasa de cierre,
informes vendidos— **no tienen fuente pública en Chile**: están en `SIN_FUENTE`,
se marcan en la UI y son los que más mueven el resultado. Hasta que haya datos
propios, el modelo dice "si pasa esto, gano esto", no "gano esto".

## Cumplimiento: qué está cubierto y qué falta

Las multas en juego son altas —hasta 20.000 UTM o 4% de los ingresos en la Ley
21.719, y hasta 1.500 UTM por publicidad engañosa— así que conviene saber dónde
estamos parados.

Cubierto:

- Base de licitud para divulgar antecedentes del vendedor: consentimiento
  expreso, con versión del texto, fecha e IP, y revocable.
- Límites del informe gratis a la vista, no en letra chica.
- El expediente y los antecedentes de inscripción fuera de los endpoints
  públicos.
- El nombre del producto sigue a la firma del abogado, no al revés.

Falta, en orden de riesgo:

- **Derechos del titular (acceso, rectificación, cancelación, oposición y
  portabilidad).** Hoy no hay forma de que un usuario pida sus datos ni que se
  los borren. Es exigible desde el 1 de diciembre de 2026.
- **Plazos de conservación.** Los informes guardan datos personales para siempre
  por diseño, porque son evidencia de qué se entregó. Hay que definir cuánto se
  conservan y qué se anonimiza al vencer ese plazo.
- **Registro de actividades de tratamiento.** Qué datos tratamos, con qué
  finalidad, con qué base y por cuánto tiempo.
- **Notificación de brechas en 72 horas.** Necesita detección y un procedimiento,
  no sólo intención.
- **Confirmar el catálogo con abogado.** Plazos de vigencia, obligatoriedad de
  cada documento y los textos de consentimiento.

## Visitas

El vendedor declara ventanas semanales (`disponibilidad_visitas`, hora de pared
chilena). De ahí salen cupos de 45 minutos cada 60, y esos 15 de diferencia son
el traslado del asesor: por eso los cupos de una misma propiedad quedan pegados.

`Propiedad.visitantesPorCupo` decide la modalidad: 1 es visita individual, más
de 1 es open house. Es la palanca más grande de costo por visita —un viaje del
asesor atendiendo a cuatro compradores en vez de uno— y la elige el vendedor,
porque hay quien no quiere grupos en su casa. Trae tres consecuencias que ya
están cubiertas y conviene no deshacer:

- **El cupo se ofrece mientras `ocupados < lugares`**, no mientras esté vacío.
- **Un comprador no puede tomar dos lugares del mismo bloque.** Con capacidad
  mayor a 1 el cupo sigue disponible después de que él reservó, así que hace
  falta el chequeo explícito por comprador (`visita_repetida`).
- **El choque de agenda del asesor sólo aplica entre propiedades distintas.**
  Dos visitas a la misma hora en la misma propiedad son el open house
  funcionando; en propiedades distintas es imposible y se rechaza.

Cuatro cosas más que conviene no romper:

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
GET   /api/v1/propiedades/:id                ficha pública; completa si eres el dueño
PATCH /api/v1/propiedades/:id                Bearer (solo el dueño)
PATCH /api/v1/propiedades/:id/estado         Bearer (solo el dueño)
GET   /api/v1/propiedades/:id/informe        Bearer (dueño, su notaría o interno)
PATCH /api/v1/propiedades/documentos/:docId  Bearer (solo el dueño)
PATCH /api/v1/propiedades/:id/notaria        Bearer (solo el dueño)
GET   /api/v1/propiedades/:id/listo-para-escriturar   Bearer
GET   /api/v1/propiedades/catalogo-documentos

GET   /api/v1/propiedades/:id/cupos          → dias[{ dia, cupos[{ inicio, fin, lugares, ocupados }] }]
GET   /api/v1/propiedades/:id/disponibilidad
PUT   /api/v1/propiedades/:id/disponibilidad Bearer (solo el dueño)  { bloques }
POST  /api/v1/propiedades/:id/visitas        Bearer  { inicio, mensaje? }
GET   /api/v1/propiedades/:id/visitas        Bearer (solo el dueño)

POST  /api/v1/propiedades/:id/informes/antecedentes   Bearer  → informe gratis, al instante
POST  /api/v1/propiedades/:id/informes/titulos        Bearer  → pedido, estado esperando_pago
GET   /api/v1/propiedades/:id/consentimiento          Bearer
PUT   /api/v1/propiedades/:id/consentimiento          Bearer (solo el dueño)
DELETE /api/v1/propiedades/:id/consentimiento         Bearer (solo el dueño)

POST  /api/v1/economia/modelo                Bearer, rol admin  { precioVentaUf, asesores, abogados, supuestos }

GET   /api/v1/informes/catalogo              público: qué trae cada nivel, precio y plazo
GET   /api/v1/informes/mios                  Bearer
GET   /api/v1/informes/:id                   Bearer (solo el comprador)
PATCH /api/v1/informes/:id/firma             Bearer, rol abogado  { conclusion, defectos }
PATCH /api/v1/informes/:id/estado            Bearer, rol admin    { estado }

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

## Decidido, todavía por construir

Cuatro definiciones tomadas para las etapas que siguen. No volver a discutirlas
sin el dueño del producto:

- **El informe va en dos niveles.** Ya construido; ver la sección del informe.
- **La modalidad de visita la elige el vendedor por propiedad.** Ya construido.
- **La promesa se firma con DocuSign**, aprovechando las llaves que ya están en
  `.env.example`. Ojo con el límite legal: DocuSign por sí solo no entrega firma
  electrónica avanzada reconocida en Chile, así que si la promesa necesita valor
  probatorio fuerte hay que sumar un socio local. Y la compraventa definitiva no
  se firma electrónicamente en ningún caso: va por escritura pública ante
  notario.
- **El bot responde la publicación y el proceso, nada legal.** Metros,
  orientación, gastos comunes, cómo funciona la comisión. Estado legal, precio o
  documentos derivan al informe o a una persona: afirmar que una propiedad no
  tiene hipoteca es una declaración material en una compraventa. Es además el
  embudo natural hacia el informe pagado.

## Fuentes legales consultadas

Para lo que afirma el catálogo del informe. Conviene reconfirmarlas con abogado
antes de producción, y revisar la 21.719 después del 1 de diciembre de 2026.

- Ley 21.719, protección de datos: https://www.bcn.cl/leychile/navegar?idNorma=1209272
- Síntesis de la 21.719 (BCN): https://obtienearchivo.bcn.cl/obtienearchivo?id=repositorio%2F10221%2F37137%2F1%2FInforme_12_25_Ley_Datos_Personales_rev.pdf
- Ley 19.496, consumidor y publicidad engañosa: https://www.bcn.cl/leychile/navegar?idNorma=61438
- Pautas para el estudio de títulos, Colegio de Abogados: https://archivo.colegioabogados.cl/cgi-bin/procesa.pl?plantilla=%2Fv2%2Farchivo.html&bri=colegioabogados&tab=art_1&campo=c_archivo&id=828
- Carpeta de estudio de títulos 10 años (CBR Santiago): https://www.conservador.cl/portal/titulo10a
- Carpeta de títulos en ChileAtiende: https://www.chileatiende.gob.cl/fichas/30436-carpeta-de-estudio-de-titulos-de-hasta-10-anos
- Certificado de hipotecas, gravámenes y prohibiciones: https://www.chileatiende.gob.cl/fichas/457-certificado-de-los-registros-de-hipotecas-gravamenes-y-prohibiciones-de-una-propiedad-gp
- Certificado de avalúo fiscal (SII): https://www.sii.cl/servicios_online/1048-.html
- Informe de no expropiación: https://www.chileatiende.gob.cl/fichas/30291-informe-de-no-expropiacion
- Reglamento de la Ley 21.442, copropiedad: https://www.minvu.gob.cl/wp-content/uploads/2025/01/Reglamento-de-la-ley-21442.pdf

Para el modelo de costos:

- Cotización de cargo del empleador (Superintendencia de Pensiones): https://www.spensiones.cl/portal/institucional/594/w3-propertyvalue-10906.html
- Nota técnica de la reforma de pensiones, Ley 21.735: https://previsionsocial.gob.cl/wp-content/uploads/2025/08/Nota-Tecnica-Reforma-de-Pensiones-Ley-N%C2%B021.735.pdf
- Aportes del empleador al sistema de pensiones: https://www.chileatiende.gob.cl/fichas/130987-aportes-del-empleador-al-sistema-de-pensiones
- Sueldos de asesor inmobiliario: https://cl.computrabajo.com/salarios/asesor-inmobiliario
- Sueldos de abogado: https://cl.indeed.com/career/abogado/salaries
- Inscripción de una propiedad en el Conservador: https://www.chileatiende.gob.cl/fichas/12116-inscripcion-de-una-propiedad

## Documentos de estrategia

- Hub de proyectos: https://claude.ai/code/artifact/daf59f43-87df-4136-81f5-40a717d8298e
- Plan técnico: https://claude.ai/code/artifact/76d11eac-7f10-4019-b112-dc725aea9c6a
- Estrategia comercial: https://claude.ai/code/artifact/7caf8be7-315c-479f-8df5-6b7ab08ff35c
- Integraciones (qué se puede conectar y qué no): https://claude.ai/code/artifact/a4639f81-e2af-4945-8150-43bd4a1970ca
