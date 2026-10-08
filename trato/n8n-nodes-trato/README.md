# n8n-nodes-trato

Nodo custom de n8n para la API de Trato. Expone tres acciones:

- **Listar propiedades pendientes** -- propiedades con rol de avalúo pero sin
  dato fresco de avalúo fiscal o de contribuciones (`GET /integraciones/propiedades-pendientes`).
- **Actualizar avalúo fiscal** -- guarda lo que el flujo consultó en sii.cl
  (`PATCH /integraciones/propiedades/:id/avaluo-fiscal`).
- **Actualizar contribuciones** -- guarda lo que el flujo consultó en
  tesoreria.cl (`PATCH /integraciones/propiedades/:id/contribuciones`).

## Lo que este nodo NO hace

**No consulta SII ni Tesorería.** Eso lo arma el flujo mismo, con nodos de n8n
que tú configures (HTTP Request, o un nodo de automatización de navegador si la
página necesita JavaScript). Este nodo es sólo el lado de Trato: lee la cola de
trabajo y guarda el resultado. La razón de separarlo así: scrapear un portal
público es un trabajo de automatización que cambia si el portal cambia su HTML,
mientras que hablar con la API de Trato es estable -- no tiene sentido
mezclarlos en el mismo nodo.

### SII (avalúo fiscal): sigue bloqueado por anti-bot

Intenté capturar la llamada JSON real que hace el portal del SII
(`https://www4.sii.cl/cuotaanualbienesraicespubinternetui/`, una app Angular)
al buscar por rol, para dejarte la configuración HTTP lista. No se pudo: el
sitio tiene protección anti-bot (queue-it) que bloquea navegadores
automatizados, y forzarlo con reintentos es exactamente lo que el doc de
integraciones advierte no hacer con un servicio del Estado. Sigue pendiente;
ver más abajo cómo capturarla a mano si alguien quiere intentarlo de nuevo.

### Tesorería (contribuciones): flujo capturado y verificado

A diferencia del SII, el flujo de `contribuciones.tgr.cl` (la app a la que
`web.tesoreria.cl` → "Pagar Contribuciones" redirige) **sí se pudo capturar y
probar de punta a punta**, con un Chromium automatizado (Playwright) y una
propiedad real (ROL 070-00001-001, Santiago). Tres llamadas encadenadas,
todas contra `https://y6gthx9mqe.execute-api.us-east-1.amazonaws.com/prod/...`
(el API Gateway que usa la app, no `tesoreria.cl` directamente):

**1. Identificar la propiedad por rol** (requiere reCAPTCHA v3 -- ver abajo):

```
POST /prod/captcha/v3/api/BienRaizWS/api/BienRaiz/bienraiz/obtener/rolin
Body: { "rol": "00001", "subrol": "001", "idcomuna": "70", "token": "<token de reCAPTCHA v3>" }
```

```json
// Respuesta real (anonimizada: nombre y RUT del propietario son públicos en
// este portal, pero no hace falta repetirlos acá)
{
  "curout": [{
    "rol": 7000001001,
    "comuna": "SANTIAGO",
    "idcomuna": 70,
    "idregion": 13,
    "region": "Region Metropolitana",
    "direccion": "ALAMEDA LIB. B. OHIGGINS 3 LC 1",
    "destPropiedad": "COMERCIO",
    "idDestPropiedad": "C"
  }],
  "captchaSessionToken": "1791342928773.9fc17884bc8b9..."
}
```

`idcomuna` sale de `POST /prod/elasticsearch/localidad` (body `{"size":400,"from":0}`,
sin autenticación ni captcha) -- trae las ~349 comunas con su id; se puede
pedir una vez y cachear como tabla estática en el flujo.

**2. Pedir la deuda, con el `rol` numérico de la respuesta anterior y el
`captchaSessionToken` reutilizado como `token`** (esta llamada NO necesita un
token de reCAPTCHA nuevo, sólo el de la sesión que abrió el paso 1):

```
POST /prod/servicios-recaudacion/v1/liquidacion/deudasrol/{rol}
Body: { "idRol": 7000001001, "listaDeudas": [], "token": "<captchaSessionToken del paso 1>" }
```

```json
// Respuesta real: 7 cuotas de deuda para esta propiedad, de 2022 a 2026.
{
  "listaDeudas": [
    {
      "nroCuota": "4-2022",
      "fechaVcto": "2022-11-30T00:00:00-03:00",
      "montoTotalTotal": 340484,
      "montoNetoTotal": 287328,
      "interesesTotal": 61718,
      "multasTotal": 0,
      "reajustesTotal": 53156,
      "condonaTotal": 61718,
      "codigoBarraTotal": "10079200032926101503011613",
      "nombreFormulario": "Bienes Raices (y A-R) -  ROL: 7000001001.Operador CCA"
    }
    // ...6 más, hasta "4-2026" (vence 2026-11-30, sin intereses/multas: al día)
  ]
}
```

`listaDeudas` sólo trae lo **no pagado** -- una cuota pagada simplemente no
aparece acá. Por eso el mapeo a lo que Trato espera es directo:

```js
// idRol: el campo "rol" de la respuesta del paso 1 (no el rol-subrol pedido)
const hoy = new Date();
const cuotas = listaDeudas.map(d => ({
  periodo: d.nroCuota,                         // "4-2022", "1-2023", ...
  monto: d.montoTotalTotal,                    // con reajustes/intereses, lo que se paga hoy
  vencimiento: d.fechaVcto.slice(0, 10),        // "2022-11-30"
  estado: new Date(d.fechaVcto) < hoy ? 'atrasada' : 'pendiente',
}));
const totalAdeudadoClp = cuotas.reduce((s, c) => s + c.monto, 0);
const alDia = cuotas.length === 0;
```

**El bloqueo real no es anti-bot como en el SII -- es reCAPTCHA v3.** El paso
1 exige un token que genera el propio `grecaptcha.execute()` de Google
corriendo en una página real (sitekey `6LcIaZ0UAAAAAAl5oRcvprd8cct3KpQNIQcjRWMj`,
visible en `contribuciones.tgr.cl`), con badge invisible -- no es un checkbox
que haya que resolver a mano, es automático si el navegador que ejecuta el
JavaScript se comporta como uno real. Un nodo **HTTP Request** puro no puede
fabricar ese token: no hay forma de calcularlo sin correr el challenge de
Google. **Confirmado que sí funciona con un navegador automatizado real**
(Playwright/Chromium, sin resolver nada a mano) -- el paso 2 en cambio es un
POST JSON normal, sin captcha propio, así que sólo el paso 1 necesita el
navegador.

Para armar esto en n8n hace falta un nodo capaz de ejecutar JavaScript en un
navegador real, no sólo pedir HTML:

- **Browserbase** (`n8n-nodes-browserbase`, nodo comunitario verificado por
  n8n, instalable desde el panel de nodos o con
  `install_community_node`): corre una sesión de Chrome real y de pago por
  uso. Es la opción más simple de instalar porque no depende de nada más que
  una API key, pero es un servicio externo nuevo -- cotizarlo antes de
  comprometerse, como se hizo con Flow para el cobro.
- Un **community node de Puppeteer/Playwright para n8n** autoalojado: sin
  costo por llamada, pero exige que el propio n8n (o un sidecar) tenga
  Chromium instalado.

El paso de abrir la página, llenar comuna/rol/subrol y esperar a que el botón
de búsqueda se habilite (el reCAPTCHA corre solo, invisible, en cuanto el
formulario es válido) tarda unos 5 segundos reales -- confirmado al cronometrar
la captura.

**No cambies el User-Agent a uno que aparente ser un navegador cuando no lo
es.** Acá al revés: como de verdad es un navegador real el que ejecuta el
JavaScript (no una petición HTTP cruda disfrazada), no hay nada que falsear.
Igual aplica cachear con ganas -- 30 días de vigencia para contribuciones
(`backend/src/services/integraciones.service.ts`) es exactamente el margen
para no golpear este flujo más que lo necesario.

**Mientras este flujo no esté terminado (o cuando un portal bloquee una
consulta puntual), no hace falta esperar:** `/datos-externos` en el panel
interno (rol admin o asesor) deja llenar el avalúo fiscal o las contribuciones
a mano, propiedad por propiedad, usando los mismos campos que este nodo
mandaría. Queda registrado con `fuente: 'manual'` en vez de `'n8n'`.

## Instalación local

```bash
cd n8n-nodes-trato
npm install
npm run build
```

Para que n8n lo cargue, dos opciones:

**A) n8n corriendo local (npm/npx):**

```bash
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom
npm link /ruta/absoluta/a/n8n-nodes-trato
```

**B) n8n en Docker:** monta la carpeta compilada como volumen en
`/home/node/.n8n/custom/n8n-nodes-trato` y reinicia el contenedor.

Reinicia n8n después de instalar. El nodo "Trato" aparece en el panel de nodos.

## Credencial

Al usar el nodo por primera vez, crea una credencial **Trato API** con:

- **URL base de la API**: por ejemplo `http://localhost:3001/api/v1` en
  desarrollo, o la URL pública del backend en producción.
- **Llave de integración**: el mismo valor que `INTEGRACION_API_KEY` en el
  `.env` del backend de Trato. Generarla con `openssl rand -hex 32` si todavía
  no existe.

## El flujo sugerido (arma esto en n8n)

```
[Schedule Trigger: diario]
        │
        ▼
[Trato: Listar propiedades pendientes (tipo = avaluo_fiscal)]
        │
        ▼
[Split in Batches / Loop Over Items]
        │
        ▼
[HTTP Request: consultar sii.cl por rol]   ← lo que falta configurar (ver arriba)
        │
        ▼
[Set / Code: armar {avaluoTotal, avaluoExento, avaluoAfecto, vigencia}]
        │
        ▼
[Trato: Actualizar avalúo fiscal (propiedadId, ...)]
```

Ese es el de avalúo fiscal (SII), todavía bloqueado -- ver arriba. El de
contribuciones (Tesorería) ya tiene sus tres llamadas reales capturadas y
verificadas:

```
[Schedule Trigger: diario]
        │
        ▼
[Trato: Listar propiedades pendientes (tipo = contribuciones)]
        │
        ▼
[Split in Batches / Loop Over Items]
        │
        ▼
[Navegador automatizado (Browserbase / Puppeteer-Playwright):
 abrir contribuciones.tgr.cl, elegir comuna, llenar rol/subrol,
 esperar a que el botón de buscar se habilite → POST a
 /obtener/rolin con token de reCAPTCHA v3 resuelto por el propio
 navegador] -- el único paso que necesita navegador, ver arriba
        │
        ▼
[HTTP Request: POST /deudasrol/{rol} con el captchaSessionToken
 del paso anterior -- este sí es HTTP Request puro, sin captcha]
        │
        ▼
[Code: mapear listaDeudas[] → {cuotas[], totalAdeudadoClp, alDia},
 fórmula completa más arriba]
        │
        ▼
[Trato: Actualizar contribuciones (propiedadId, ...)]
```

Ambos flujos pueden ir en el mismo workflow (dos ramas) o en flujos
separados con su propio horario -- contribuciones cambia trimestralmente,
avalúo fiscal semestralmente, así que no necesitan la misma frecuencia.

**Este flujo ya está armado como workflow de n8n**, en la cuenta personal
del dueño del proyecto: ["Trato - Contribuciones (Tesorería)"](https://krostyman666.app.n8n.cloud/workflow/neHHeekLAE0LtnDj),
guardado pero **sin activar** (no corre solo ni gasta nada hasta que alguien
lo active). Usa HTTP Request contra `GET /integraciones/propiedades-pendientes`
y `PATCH /integraciones/propiedades/:id/contribuciones` (sin el nodo custom
`n8n-nodes-trato`, que exigiría publicarlo en el registro de npm para
instalarlo en una cuenta de n8n gestionada -- hablar con la misma API por
HTTP Request directo es exactamente lo mismo que haría el nodo custom, así
que no hace falta).

### Primera versión (descartada): una sola llamada síncrona

En vez de replicar las tres llamadas crudas a la API interna de AWS
(`obtener/rolin` + `deudasrol`), la primera versión del paso de Tesorería
usaba un nodo de **agente de navegador** (Browserbase, vía el Gateway de
n8n -- sin necesidad de cuenta ni tarjeta propia) al que se le daba una
instrucción en lenguaje natural: entrar a `web.tesoreria.cl`, llegar a
"Pagar Contribuciones", llenar comuna/rol/subrol, esperar a que el
reCAPTCHA v3 invisible se resolviera solo, y reportar la propiedad y las
cuotas tal como las muestra la página, en JSON -- todo dentro de una única
llamada síncrona (`resource: agent`, `operation: execute`).

**Se probó cuatro veces contra el servicio real** (ROL 00001-001 Santiago,
y ROL 711-59 Las Condes; modo `cua` y modo `dom`; instrucción larga y una
versión corta con URL de entrada directa a `contribuciones.tgr.cl`) y **las
cuatro veces el paso se cortó entre 130 y 142 segundos** con el mismo error:

```
Error 524: A timeout occurred
The origin web server did not return a complete response within
the 120-second Proxy Read Timeout window
```

Este error no venía de Tesorería ni de Browserbase -- venía del propio
**Gateway de n8n** (`ai-assistant.n8n.io`), que actúa de intermediario para
la credencial gestionada y corta la llamada síncrona a los ~120 segundos
fijos. Ni el modo, ni el largo de la instrucción, ni partir directo en
`contribuciones.tgr.cl` en vez de `web.tesoreria.cl` cambiaron el resultado
de forma significativa -- la tarea completa (cargar la página, llenar
comuna/rol/subrol, esperar el reCAPTCHA v3, leer el resultado y responder
en JSON) simplemente no entraba en esa ventana, de forma consistente. Era
un límite estructural de empaquetar la tarea completa en una sola llamada
bloqueante, no algo que se arreglara ajustando parámetros. El workflow de
prueba usado para estas cuatro corridas quedó archivado; el workflow real
de esta primera versión también se archivó al reemplazarlo por la que
sigue.

### Segunda versión (la actual): arranque asíncrono + sondeo corto

La idea: en vez de una llamada que espera a que toda la tarea termine,
dividirla en **llamadas cortas** que individualmente nunca se acercan al
techo de 120s del Gateway, sin importar cuánto tarde la tarea completa.

Se evaluó si una versión más nueva de `n8n-nodes-browserbase` exponía
operaciones de sesión más granulares -- no: por el Gateway sólo expone
`agent.execute` (la que falla), `search.search` y `fetch.fetch` (sin
JavaScript, no sirve para un formulario con reCAPTCHA). **Firecrawl**, que
también está cubierto por los créditos del Gateway de n8n (`firecrawlApi`,
sin cuenta propia, igual que Browserbase), sí expone lo necesario: un modo
asíncrono (`resource: Agent`, `operation: agentAsync` +
`getAgentStatus`) donde arrancar el trabajo y consultar su estado son dos
llamadas HTTP cortas separadas, en vez de una sola que bloquea hasta el
final.

El flujo nuevo, por propiedad:

```
[Preparar rol y subrol]
        │
        ▼
[Firecrawl: Iniciar consulta Tesorería (Agent.agentAsync)]
   -- llamada corta, devuelve un id de job al instante
        │
        ▼
[Preparar intentos de sondeo: genera hasta 16 intentos]
        │
        ▼
   ┌─── bucle (splitInBatches) ───────────────────────┐
   │ [Esperar 15s]                                     │
   │       ▼                                           │
   │ [Firecrawl: Consultar estado del job              │
   │  (Agent.getAgentStatus)] -- llamada corta          │
   │       ▼                                           │
   │ [¿Terminó? (completed/failed)]                     │
   │   no ──────────────────────────► vuelve a esperar  │
   └─── sí ─────────────────────────────────────────────┘
        │
        ▼
[Mapear resultado: recalcula pendiente/atrasada por fecha;
 si el job falló o no trae datos usables, NO guarda nada --
 registra el motivo y sigue con la siguiente propiedad]
        │
        ▼
[Trato: Guardar contribuciones] (sólo si hubo datos reales)
```

16 intentos × 15s = 4 minutos de margen sobre los ~140s medidos en la
primera versión -- si Firecrawl tarda lo mismo que Browserbase, el sondeo
lo alcanza a ver sin problema, porque ninguna llamada individual espera
más que unos segundos. El agente recibe la misma instrucción de siempre
(navegar a `contribuciones.tgr.cl`, elegir comuna, llenar rol/subrol,
esperar el reCAPTCHA v3 invisible, leer el resultado) más un esquema JSON
explícito (`schemaType: manual`) para que Firecrawl devuelva el objeto ya
tipado en vez de depender de que el modelo formatee JSON a mano dentro de
un texto.

**Probada en vivo contra el servicio real (ROL 711-59, Las Condes) y
confirmada funcionando de punta a punta**, tanto en el workflow real como en
un workflow de prueba aparte. La corrida expuso la forma real -- no
documentada -- de la respuesta de Firecrawl, distinta de lo que se había
asumido al construir el flujo, y con eso se encontraron y corrigieron tres
fallas:

- **`agentAsync` devuelve el id del job anidado bajo `data`**
  (`{"data": {"success": true, "id": "...", "threadId": "..."}}`), no al
  nivel superior. El nodo `Preparar intentos de sondeo` no lo veía y
  fallaba con un mensaje honesto ("Firecrawl no devolvio un id de job...")
  en vez de romperse en silencio -- justo lo que ese diseño defensivo debía
  hacer, y lo hizo. Arreglado desenvolviendo `data` antes de buscar
  `id`/`agentId`/`jobId`.
- **`getAgentStatus` devuelve el estado doblemente anidado**:
  `{"data": {"success": true, "status": "completed"|"processing"|"failed",
  "data": {<objeto extraído>}, "model": "spark-2", "creditsUsed": 43, ...}}`.
  El nodo `¿Terminó el job?` comparaba `$json.status` (nivel equivocado) y
  nunca detectaba `completed`: agotaba los 16 intentos aunque el dato ya
  estuviera listo desde antes. Arreglado comparando `$json.data.status`.
- **El esquema de extracción no se respeta de forma estricta.** Pese a
  declarar `monto` como `number`, Firecrawl lo devolvió como texto con
  formato de moneda (`"$ 938.189"`); y pese a pedir el campo `vencimiento`,
  lo devolvió como `fecha_vencimiento`, en formato chileno abreviado
  (`"30/nov./26"`, no ISO). El nodo `Mapear resultado de Tesorería` ahora
  normaliza ambos de forma determinista -- nunca adivina un valor, sólo
  reinterpreta el mismo dato que la página mostró: quita todo lo que no sea
  dígito para el monto (`"$ 938.189"` → `938189`) y traduce el mes
  abreviado para la fecha (`"30/nov./26"` → `"2026-11-30"`). Cada campo
  extraído además trae un `<campo>_citation` con la URL fuente (inofensivo,
  se ignora).

Dato real devuelto por la consulta de prueba: propiedad "Rosario 90", Las
Condes, rol 071-00711-059, una cuota de período 4-2026 por $938.189 con
vencimiento 2026-11-30 -- 43 créditos de Gateway consumidos en esa corrida.

**Mientras tanto, `/datos-externos` sigue siendo el camino real** para
cargar contribuciones: no es un parche temporal, es la vía que ya funciona
hoy. El flujo de Tesorería ya está probado y funcionando; lo único que
falta para activarlo es:

1. Abrir el nodo **Config** y poner la URL pública del backend de Trato
   (hoy el backend sólo corre en `localhost` dentro de una sesión de
   desarrollo efímera -- no hay todavía un despliegue público al que n8n
   pueda llamar) -- esto sigue pendiente independientemente de la
   arquitectura de Tesorería.
2. Abrir cualquiera de los nodos **Trato - Integración API Key** y
   configurar la credencial con el mismo valor que `INTEGRACION_API_KEY` en
   el `.env` del backend, como header `x-integracion-key`.
3. Confirmar la credencial **Firecrawl (Gateway)** en los dos nodos de
   Firecrawl -- queda asignada sola vía el Gateway de n8n al crear el
   workflow, pero conviene revisarla antes de activar.

El flujo de avalúo fiscal (SII) no se armó: sigue bloqueado por anti-bot
real (queue-it), no por reCAPTCHA, y un workflow para algo confirmado que
no funciona no sirve de nada.

## Forma de los datos que Trato espera

**Avalúo fiscal** (`PATCH .../avaluo-fiscal`):

```json
{
  "avaluoTotal": 85000000,
  "avaluoExento": 40000000,
  "avaluoAfecto": 45000000,
  "vigencia": "2026-2"
}
```

**Contribuciones** (`PATCH .../contribuciones`):

```json
{
  "cuotas": [
    { "periodo": "2026-3", "monto": 95000, "vencimiento": "2026-09-30", "estado": "pagada" },
    { "periodo": "2026-4", "monto": 95000, "vencimiento": "2026-11-30", "estado": "pendiente" }
  ],
  "totalAdeudadoClp": 0,
  "alDia": true
}
```

`estado` es uno de `pagada | pendiente | atrasada`. Ambos endpoints devuelven
`409 sin_rol_avaluo` si la propiedad no tiene rol informado -- no debería pasar
si el `propiedadId` salió de "Listar propiedades pendientes".
