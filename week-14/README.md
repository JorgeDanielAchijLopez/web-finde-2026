# Semana 14 — Tiempo real: WebSocket y Server-Sent Events

Dos ejemplos en un monorepo:

| App | Tecnología | Qué enseña |
| --- | --- | --- |
| `apps/chat` | **WebSocket** | Chat estilo Discord: canales, presencia y mensajes directos. Comunicación en **las dos direcciones**. |
| `apps/notify` | **Server-Sent Events (SSE)** | Notificaciones en vivo. Comunicación en **una dirección** (servidor → cliente). Ruta `/admin` para enviar. |
| `apps/api` | Hono en Node 24 | Un solo servidor para los dos ejemplos. |

## Estructura

```
week-14/                         Turborepo + pnpm
├─ apps/
│  ├─ api/                       Hono (Node 24 ejecuta TypeScript directamente)
│  │  └─ src/
│  │     ├─ main.ts              composition root: broker -> servicios -> rutas
│  │     ├─ broker/
│  │     │  ├─ broker.ts         puerto (interfaz): publish / subscribe
│  │     │  └─ in-memory.broker.ts  adaptador en memoria (cambiar por Redis para escalar)
│  │     └─ modules/
│  │        ├─ chat/             WebSocket: rutas (adaptador) + servicio (lógica)
│  │        └─ notifications/    SSE: rutas (adaptador) + servicio (lógica)
│  ├─ chat/                      React + Vite (puerto 5173)
│  └─ notify/                    React + Vite + React Router (puerto 5174)
└─ packages/
   ├─ protocol/                  contrato compartido: tipos + esquemas Zod
   └─ ui/                        componentes shadcn/ui compartidos
```

### Ideas clave del código

1. **WebSocket no tiene canales.** WebSocket solo envía y recibe mensajes. Los canales, la presencia y el "broadcast" son código nuestro: un `Map<canal, Set<conexión>>` en `chat.service.ts` y un protocolo propio en `packages/protocol/src/chat.ts`.
2. **Un solo contrato.** El servidor y el frontend importan los mismos esquemas Zod. El servidor valida cada mensaje que recibe. El cliente también valida lo que recibe.
3. **Puertos y adaptadores.** Los servicios dependen de la interfaz `Broker`, no de una implementación. Con varios servidores, un `RedisBroker` reemplaza a `InMemoryBroker` en una sola línea de `main.ts`.
4. **SSE reconecta solo (casi siempre).** `EventSource` reconecta automáticamente y envía la cabecera `Last-Event-ID`. El servidor reenvía las notificaciones perdidas. WebSocket no hace esto: el cliente del chat implementa su propia reconexión.
5. **Excepción importante:** si al reconectar el servidor responde con un error HTTP (por ejemplo, el `502` de un proxy mientras la API reinicia), `EventSource` se detiene para siempre (`readyState === CLOSED`). `notificationsStream.ts` crea un `EventSource` nuevo en ese caso y envía el último id en `?lastEventId=`, porque un `EventSource` nuevo no puede enviar cabeceras.

## Requisitos

- Node **24** o superior
- pnpm 10 (`corepack enable` o `npm i -g pnpm`)

## Instalación y ejecución

```bash
pnpm install
pnpm dev          # inicia api (8787), chat (5173) y notify (5174)
```

- Chat: http://localhost:5173
- Notificaciones: http://localhost:5174 y http://localhost:5174/admin

Para iniciar solo una parte:

```bash
pnpm --filter @week14/api dev
pnpm --filter @week14/chat dev
pnpm --filter @week14/notify dev
```

### ¿Por qué no hay paso de compilación en la API?

Node 24 elimina los tipos de TypeScript y ejecuta el archivo `.ts` (*type stripping*). Esto tiene reglas:

- Las importaciones relativas usan la extensión `.ts`.
- Solo sintaxis "borrable": no `enum`, no `namespace`, no propiedades en el constructor (`constructor(private x: X)`).
- `tsconfig.base.json` activa `erasableSyntaxOnly` para detectar estos errores en el editor.

Por esta razón no usamos Nest.js: Nest necesita decoradores con metadatos, y Node no puede generar esos metadatos sin compilar.

## Ver el protocolo con curl

### SSE

El navegador usa `EventSource`. Con `curl -N` (sin buffer) se ve el formato real:

```bash
curl -N http://localhost:8787/api/notifications
```

En otra terminal, envíe una notificación. Es una petición HTTP normal:

```bash
curl -X POST http://localhost:8787/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"title":"Examen","body":"El examen es el viernes","level":"warning"}'
```

La primera terminal muestra:

```
retry: 3000

event: notification
data: {"title":"Examen","body":"El examen es el viernes","level":"warning","id":1,"createdAt":"..."}
id: 1

```

Cada 15 s el servidor también envía `: ping` (un comentario) para que ngrok y otros proxies no cierren la conexión.

Reconecte con `-H "Last-Event-ID: 1"` para recibir solo las notificaciones posteriores a la 1.

### WebSocket

Abra las herramientas de desarrollo del navegador → **Network** → filtro **WS** → seleccione `/ws` → pestaña **Messages**. Ahí se ven los mensajes en las dos direcciones. En la pestaña **Headers** se ve el handshake: `Upgrade: websocket` y la respuesta `101 Switching Protocols`.

## Demo en clase con ngrok

Los estudiantes se conectan desde su teléfono. Vite reenvía `/ws` y `/api` al servidor Hono (proxy), entonces **un túnel por app** es suficiente:

```bash
pnpm dev                 # terminal 1
ngrok http 5173          # terminal 2: chat
ngrok http 5174          # terminal 3: notificaciones (opcional)
```

- Comparta la URL `https://….ngrok-free.app` del chat.
- ngrok usa HTTPS, entonces el cliente usa `wss://` automáticamente.
- El plan gratuito de ngrok muestra una página de advertencia la primera vez. Los estudiantes presionan **Visit Site**.
- Para dos túneles al mismo tiempo, defina los dos en el archivo de configuración de ngrok y ejecute `ngrok start --all`.

### Experimentos para la clase

1. **Canales:** dos estudiantes en `FreeFire`, uno en `FIFA`. El mensaje en `FreeFire` no llega a `FIFA`.
2. **Presencia:** cierre una pestaña. La lista de miembros cambia en las otras.
3. **Reconexión SSE con Last-Event-ID:** envíe tres notificaciones. Después ejecute `curl -N -H "Last-Event-ID: 1" http://localhost:8787/api/notifications`. El servidor reenvía solo las notificaciones 2 y 3: las que ese cliente "perdió".
4. **Reinicio del servidor:** abra `/` y detenga la API (`Ctrl+C`). El estado cambia a "Reconectando…". Inicie la API otra vez: el estado vuelve a "Conectado" sin recargar la página. Las notificaciones anteriores se pierden porque están en memoria.
5. **Seguridad:** envíe `<script>alert(1)</script>` en el chat. React muestra el texto, no lo ejecuta.
6. **Validación:** en la consola del navegador (en la página del chat), abra un WebSocket propio y envíe un mensaje inválido. El servidor responde con `{ "type": "error" }`:

   ```js
   const ws = new WebSocket(`ws://${location.host}/ws`);
   ws.onmessage = (e) => console.log(e.data);
   ws.onopen = () => ws.send("hola");
   ```

## Ejercicios propuestos

- Historial: agregue `GET /api/channels/:channel/messages` (HTTP) y cárguelo al entrar a un canal. Discord usa HTTP para el historial y WebSocket solo para eventos en vivo.
- Indicador "está escribiendo…": nuevo tipo de mensaje en `packages/protocol`.
- `RedisBroker`: implemente la interfaz `Broker` con Redis pub/sub e inicie dos instancias de la API en puertos diferentes.
