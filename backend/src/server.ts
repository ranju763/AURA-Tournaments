import { Hono } from 'hono'
import { tournamentsRoutes } from './routes/tournaments'
import { tournamentDetailsRoutes } from './routes/tournamentsDetails'
import { liveScoreRoutes } from './routes/liveScore'
import { ServerWebSocket } from 'bun'
import { cors } from 'hono/cors' 
import 'dotenv/config'

const app = new Hono()

app.use('*', cors({
  origin: '*', // allow requests from any origin
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

const clients = new Set<ServerWebSocket>()

app.route('/tournaments',tournamentsRoutes)
app.route('/tournaments/:id', tournamentDetailsRoutes)
app.route('/live-score', liveScoreRoutes)

app.get('/', (c) => c.text('Supabase + Hono API running ✔'))

const PORT = process.env.PORT || 3000

const server = Bun.serve({
  fetch(req, bunServer) {
    // Upgrade to WebSocket if possible
    const upgraded = bunServer.upgrade(req)
    if (upgraded) return
    // Otherwise, use Hono for normal HTTP routes
    return app.fetch(req)
  },
  port: 3000,
  websocket: {
    // New WebSocket connection
    open(ws: ServerWebSocket) {
      console.log('WebSocket connected')
      clients.add(ws)
    },
    // Message from client
    message(ws: ServerWebSocket, message: string | Uint8Array) {
      console.log('Message received from client:', message.toString())
      // Optional: handle commands from client
    },
    // Connection closed
    close(ws: ServerWebSocket, code: number, reason: string) {
      console.log('WebSocket disconnected', code, reason)
      clients.delete(ws)
    },
    // Backpressure (optional)
    drain(ws: ServerWebSocket) {
      console.log('WebSocket drain event')
    },
  },
})

console.log(`Server running on http://localhost:${PORT}`)