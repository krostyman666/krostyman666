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

### Lo que falta para la primera consulta real

Intenté capturar la llamada JSON real que hace el portal del SII
(`https://www4.sii.cl/cuotaanualbienesraicespubinternetui/`, una app Angular)
al buscar por rol, para dejarte la configuración HTTP lista. No se pudo: el
sitio tiene protección anti-bot (queue-it) que bloquea navegadores
automatizados, y forzarlo con reintentos es exactamente lo que el doc de
integraciones advierte no hacer con un servicio del Estado.

Para completar esa pieza:

1. Abre el portal en tu propio navegador (Chrome/Firefox), con las
   herramientas de desarrollador abiertas en la pestaña **Red/Network**.
2. Busca una propiedad por rol como lo haría un usuario normal.
3. En Network, filtra por XHR/Fetch y encuentra la llamada que trae los datos
   (probablemente un POST o GET a una URL bajo
   `/cuotaanualbienesraicespubinternetui/...` que responde JSON).
4. Copia esa URL, método y payload a un nodo **HTTP Request** en tu flujo de
   n8n. Mismo procedimiento para `tesoreria.cl` o `web.tesoreria.cl` (el flujo
   de pago de contribuciones por rol).
5. Si la página arma la petición con JavaScript del lado del cliente y no hay
   una llamada de red directa y estable, vas a necesitar un nodo de
   automatización de navegador (ej. un community node de Puppeteer/Playwright
   para n8n) en vez de HTTP Request puro.

Identifícate honestamente (User-Agent real, no falsificar ser un navegador
humano si el sitio lo pide explícitamente), no dispares la consulta más
seguido de lo que la necesitas, y cachea el resultado -- Trato ya cachea lo que
le envíes (30 días para contribuciones, 180 para avalúo fiscal; ver
`backend/src/services/integraciones.service.ts`), así que no hace falta
volver a consultar antes de que venza.

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

Igual para contribuciones, cambiando el tipo y el nodo de destino. Pueden ir
en el mismo flujo (dos ramas) o en flujos separados con su propio horario --
contribuciones cambia trimestralmente, avalúo fiscal semestralmente, así que
no necesitan la misma frecuencia.

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
