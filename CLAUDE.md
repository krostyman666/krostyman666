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
| Cobro del informe por transferencia, con conciliación manual | Listo, probado en navegador |
| Cobro con tarjeta (Flow) | Pendiente — falta contratar y poner credenciales |
| Derechos del titular: acceso, rectificación, supresión, oposición, portabilidad | Listo, probado en navegador |
| Registro de actividades de tratamiento y plazos de conservación | Listo; la purga de lo vencido se informa, no se ejecuta sola |
| Conexión a SII y Tesorería para avalúo y contribuciones | Pendiente |
| Bot de preguntas del comprador, con cola interna de derivaciones | Listo, probado en navegador |
| Promesa: negociación de cláusulas entre las partes | Listo, probado en navegador |
| Firma de la promesa (DocuSign) | Pendiente — falta contratar y poner credenciales |
| Compraventa y escritura | Pendiente |
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
- **Un PATCH parcial de propiedad borraba datos.** `actualizarPropiedadSchema`
  se derivaba de `crearPropiedadSchema` con `fork(..., optional)`, pero Joi
  conserva los `.default()` y los aplica a las claves ausentes: editar sólo el
  precio llegaba al update con `fotos: []`, `estacionamientos: 0`, `bodegas: 0`,
  `tieneHipoteca: false`, `moneda: 'uf'` y `visitantesPorCupo: 1`. Es decir,
  cambiar el precio borraba las fotos de la publicación. Se arregla con
  `.prefs({ noDefaults: true })` sobre el esquema de actualización. Cualquier
  esquema de PATCH que se derive de uno de creación necesita lo mismo.
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

## La promesa de compraventa

`backend/src/dominio/promesa.ts`. El Código Civil parte diciendo que "la promesa
de celebrar un contrato no produce obligación alguna", y sólo la salva si
concurren las cuatro circunstancias del **artículo 1554**. Falta una y la
promesa es **nula de nulidad absoluta**: el comprador que pagó un pie se queda
sin contrato que exigir.

Por eso los cuatro requisitos se verifican en código y **bloquean el paso a
acordada**, en vez de quedar como advertencia que alguien lee o no. `acordar()`
los vuelve a verificar aunque la UI ya los muestre: ese es el punto donde la
promesa deja de ser borrador.

Cómo funciona la negociación:

- Las cláusulas obligatorias nacen con la promesa. El alzamiento sólo si la
  propiedad tiene hipoteca declarada, porque prometer la venta de un inmueble
  hipotecado sin decir cómo se alza choca con el 1554 Nº2.
- **Quien propone un texto se entiende de acuerdo con él**, así que basta la
  aceptación de la contraparte. Nadie puede aceptar su propia cláusula.
- **Cambiar el texto anula la aceptación**, por hook del modelo y no del
  servicio, igual que en `Documento`. Sin eso se podía acordar algo y
  reescribirlo después.
- **Una cláusula con marcadores sin llenar no se puede aceptar ni cuenta para
  los requisitos.** Un texto que dice `{fojas}` no especifica nada, y el 1554
  Nº4 exige justamente que el contrato prometido esté especificado. El guard
  está en el servicio, no sólo en la UI.
- Las obligatorias no se pueden quitar; las negociables sí.

Los textos del catálogo son plantillas para negociar, no un contrato listo para
firmar: la promesa acordada la revisa un abogado antes de la firma, y por eso
`revisar()` rechaza una cuenta de abogado sin RUT vigente. Los plazos (60 días
con fondos propios, 90 a 120 con crédito) y los porcentajes de multa (5% a 20%)
son prácticas de mercado, no reglas legales.

## El bot de la ficha

`backend/src/dominio/bot.catalogo.ts`. Responde al comprador en la ficha de la
propiedad sobre dos cosas —la publicación (metros, distribución, precio de
lista, modalidad de visita) y el proceso (agendar, informe, comisión, promesa,
escritura)— y deriva todo lo demás. Es el embudo natural hacia el informe
pagado.

Las decisiones que lo hacen ponible en producción:

- **Ninguna respuesta se genera.** El texto que lee el comprador sale siempre
  del catálogo: o es una constante, o lo arma `responde()` con campos ya
  guardados. Un modelo generativo no puede garantizar que no afirme un hecho
  que nadie verificó, y en una compraventa ese hecho lo paga el comprador en la
  escritura. El único lugar donde un modelo sería seguro es reemplazar
  `detectarIntencion` —clasificar la pregunta dentro del conjunto cerrado de
  temas—: una clasificación errada da una respuesta cierta fuera de lugar, o una
  derivación, nunca una mentira.
- **Las zonas reservadas ganan.** `ZONAS_RESERVADAS` son las materias que el bot
  no afirma aunque tenga el dato: estado legal, deudas, valor real, consejo,
  contacto del vendedor, dirección exacta. Se evalúan antes que los temas y
  derivan. Afirmar el estado legal de un inmueble es una declaración material;
  equivocarse es responsabilidad civil y publicidad engañosa (Ley 19.496, hasta
  1.500 UTM, que incluye la inducción a error por omisión).
- **La asimetría de la hipoteca.** `tieneHipoteca` existe y aun así el bot no
  dice "no tiene hipoteca". Que el vendedor declare que SÍ hay se informa
  (etiquetado como declaración suya); que no la haya declarado NO se desmiente,
  porque eso lo certifica el Conservador. Vale igual para deudas, embargos y
  prohibiciones: lo que suma riesgo se informa, lo que lo descarta se certifica.
- **Derivar es la respuesta correcta, no una falla.** Cuando el bot dice "te
  responde un asesor", esa promesa queda como fila en `mensajes_bot` con
  `destino` y `atendidoEn`: es una cola de trabajo, no una cortesía. Sin la fila
  el comprador espera una llamada que nadie sabe que debe hacer.
- **Contesta sin sesión.** `usuarioId` es nullable a propósito: obligar a
  registrarse para preguntar los metros espanta al comprador antes del embudo.
  La `sesion` la genera el navegador y agrupa el hilo sin identificar a nadie.
  El texto de la pregunta lo escribe la persona y se borra al suprimir la
  cuenta, igual que `Visita.mensaje`.

La cola interna (`/preguntas`, rol asesor o admin) parte en dos listas por
**motivo**, no por urgencia, porque toda pregunta no entendida deriva a persona
y partir por atención dejaría una lista siempre vacía:

- **Derivó a una persona**: el bot entendió y aun así no contestó. Es el límite
  funcionando; falta que alguien cierre con el comprador.
- **No supo contestar**: el bot no entendió. También hay que responderle, y
  además es la hoja de ruta de los temas que al catálogo le faltan. La métrica
  que importa es `tasaSinEntender`: mientras suba, el catálogo queda corto.

`backend/src/utils/formato.ts` existe sólo porque el bot arma frases en el
backend: "UF 8400" en medio de una respuesta se lee como un error del sistema.

## Cobro

`backend/src/dominio/pagos.ts` define los medios. Dos decisiones con fundamento
que conviene no revertir sin cotizar de nuevo:

- **Stripe queda fuera**, pese a las llaves que había reservadas en
  `.env.example`. Sólo admite registro de empresas en 46 países y Chile no está
  entre ellos —en Sudamérica sólo Brasil—, así que una sociedad chilena no puede
  onboardearse directo. Además cobra 3,6% + $30, la comisión más alta del
  mercado local.
- **El destino es Flow.** Es agregador: una integración da Webpay, transferencia
  y Servipag sin que nosotros pasemos por la certificación de Transbank, y deja
  la transferencia en 0,99% + IVA. En un cobro de $100.000 eso es la diferencia
  entre pagar $1.200 y pagar $4.200.

Mientras no haya credenciales se cobra por transferencia con conciliación
manual, que es como opera buena parte del comercio chico en Chile. El flujo está
completo y el proveedor entra sin rehacerlo.

Tres cosas del diseño:

- **El monto se congela en el `Pago`.** Lo cobrado es un hecho fechado y cambiar
  el precio de lista no puede reescribir lo que alguien ya pagó.
- **La `referencia` es lo que hace calzable la transferencia.** Va sin I, O, 0 ni
  1 porque el comprador la copia a mano al mensaje del abono y esos cuatro se
  confunden. Sin ella hay que adivinar de quién es cada depósito.
- **Conciliar mueve el informe en la misma transacción.** Cobrar y no avanzar el
  informe deja al comprador pagando por nada, así que van juntos o no van.
- **Un solo cobro abierto por informe.** Dos referencias vivas para la misma
  deuda es la receta para cobrar dos veces o conciliar la equivocada.

El comprador avisa que transfirió, pero eso no confirma nada: lo calza una
persona en `/pagos`. La comisión de la pasarela entra en el modelo de
rentabilidad, porque su IVA es costo y no se recupera.

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
- Los cinco derechos del titular, en `/mis-datos`. Ver la sección siguiente.
- Registro de actividades de tratamiento, con finalidad, base y plazo por
  categoría.

Falta, en orden de riesgo:

- **Notificación de brechas en 72 horas.** Necesita detección y un procedimiento,
  no sólo intención.
- **Ejecutar la purga de lo vencido.** `datosVencidos()` informa qué pasó su
  plazo; borrarlo o anonimizarlo es todavía una decisión manual.
- **Confirmar el catálogo con abogado.** Plazos de vigencia, obligatoriedad de
  cada documento, los plazos de conservación y los textos de consentimiento.

## Datos personales y derechos del titular

`backend/src/dominio/datos-personales.ts` es el registro de actividades de
tratamiento: qué datos tratamos, para qué, con qué base de licitud y por cuánto
tiempo. Está en código y no en un documento aparte porque de ahí salen dos cosas
que el sistema ejecuta: qué se puede suprimir cuando el titular lo pide, y qué
se anonimiza al vencer su plazo.

Las decisiones que conviene entender antes de tocarlo:

- **Se anonimiza la persona, se conserva la operación.** Borrar la fila del
  usuario arrastraría visitas, informes y expedientes que otra norma obliga a
  conservar. En su lugar el nombre, correo, RUT y teléfono se reemplazan por un
  marcador y la cuenta queda sin poder entrar. Por eso `Usuario.rut` es
  nullable: nulo significa suprimido.
- **Se anuncia sólo lo que existe.** La evaluación de supresión cuenta lo que el
  titular realmente tiene antes de decirle qué se retiene. Avisarle que
  guardamos autorizaciones que nunca dio es una respuesta falsa.
- **La supresión se bloquea con una operación en curso**, no con una cerrada.
  Sin RUT no se puede escriturar; una vez cerrada, la persona se anonimiza y la
  documentación queda.
- **Las solicitudes sobreviven al usuario.** `solicitudes_datos` es la evidencia
  de haber atendido cada derecho. Borrarla junto con la cuenta destruiría la
  prueba de que se atendió la petición.
- **Un abogado anonimizado no puede firmar.** La pauta del Colegio de Abogados
  exige sus datos en el informe, así que `firmarTitulos` rechaza una cuenta sin
  RUT vigente.
- **El registro es público, ejercer los derechos no.** `/mis-datos` se lee sin
  sesión para que alguien pueda decidir antes de registrarse.

Los plazos de conservación hay que confirmarlos con abogado. El de 6 años viene
de la prescripción tributaria extendida; los demás son criterios comerciales.

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

GET   /api/v1/promesas/catalogo              público: cláusulas y requisitos del 1554
GET   /api/v1/promesas/mias                  Bearer
POST  /api/v1/promesas/propiedad/:id         Bearer (comprador) { precio, pie?, fechaEscritura? }
GET   /api/v1/promesas/:id                   Bearer (comprador o vendedor)
PUT   /api/v1/promesas/:id/clausulas/:codigo Bearer { texto, comentario? }
PATCH /api/v1/promesas/clausulas/:id/aceptar Bearer (la contraparte)
DELETE /api/v1/promesas/clausulas/:id        Bearer (sólo las negociables)
PATCH /api/v1/promesas/:id/acordar           Bearer → verifica el 1554
PATCH /api/v1/promesas/:id/reabrir           Bearer
PATCH /api/v1/promesas/:id/desistir          Bearer { motivo }
PATCH /api/v1/promesas/:id/revision          Bearer, rol abogado

GET   /api/v1/bot/sugeridas                   público: preguntas de arranque
GET   /api/v1/bot/propiedad/:id              público: historial de una sesión  ?sesion=
POST  /api/v1/bot/propiedad/:id              autenticarOpcional { pregunta, sesion } → respuesta del catálogo
GET   /api/v1/bot/pendientes                 Bearer, rol asesor|admin → derivaciones y no entendidas
GET   /api/v1/bot/resumen                    Bearer, rol asesor|admin  ?desde=
PATCH /api/v1/bot/mensajes/:id/atender       Bearer, rol asesor|admin { nota }

GET   /api/v1/pagos/informe/:informeId       Bearer → medios, instrucciones y pagos del informe
POST  /api/v1/pagos/informe/:informeId       Bearer { medio } → inicia el cobro
PATCH /api/v1/pagos/:id/reportar             Bearer (comprador) → "ya transferí"
GET   /api/v1/pagos/por-conciliar            Bearer, rol admin
PATCH /api/v1/pagos/:id/conciliar            Bearer, rol admin → pago pagado + informe en preparación
PATCH /api/v1/pagos/:id/anular               Bearer, rol admin { motivo }

GET   /api/v1/mis-datos/registro             público: qué tratamos, para qué y por cuánto
GET   /api/v1/mis-datos/exportar             Bearer → JSON completo (acceso y portabilidad)
PATCH /api/v1/mis-datos                      Bearer { nombre?, apellido?, telefono?, email? }
GET   /api/v1/mis-datos/supresion            Bearer → qué se borraría y qué se retiene
DELETE /api/v1/mis-datos                     Bearer → anonimiza la cuenta
GET   /api/v1/mis-datos/vencidos             Bearer, rol admin

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
- **El bot responde la publicación y el proceso, nada legal.** Ya construido;
  ver la sección del bot. Metros, distribución, gastos comunes, cómo funciona la
  comisión. Estado legal, precio o documentos derivan al informe o a una
  persona: afirmar que una propiedad no tiene hipoteca es una declaración
  material en una compraventa. Es además el embudo natural hacia el informe
  pagado.

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

Para los medios de cobro:

- Comparativa de pasarelas en Chile: https://www.rebill.com/blog/pasarelas-pago-chile
- Medios de pago para ecommerce chileno: https://www.milaecommerce.com/medios-de-pago-ecommerce-chile
- Cobertura de Stripe por país: https://stripe.com/global

Para la promesa:

- Artículo 1554 del Código Civil: https://leyes-cl.com/codigo_civil/1554.htm
- El contrato de promesa (Juan Andrés Orrego): https://www.juanandresorrego.cl/assets/pdf/apu/ap_6/Contrato%20de%20Promesa.pdf
- Promesa de compraventa de inmueble, requisitos: https://toroblancoabogados.cl/promesa-compraventa-inmueble-chile/

## Documentos de estrategia

- Hub de proyectos: https://claude.ai/code/artifact/daf59f43-87df-4136-81f5-40a717d8298e
- Plan técnico: https://claude.ai/code/artifact/76d11eac-7f10-4019-b112-dc725aea9c6a
- Estrategia comercial: https://claude.ai/code/artifact/7caf8be7-315c-479f-8df5-6b7ab08ff35c
- Integraciones (qué se puede conectar y qué no): https://claude.ai/code/artifact/a4639f81-e2af-4945-8150-43bd4a1970ca
