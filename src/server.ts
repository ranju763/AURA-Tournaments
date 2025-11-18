import { Hono } from 'hono'
import { tournamentsRoutes } from './routes/tournaments'
import { tournamentDetailsRoutes } from './routes/tournamentsDetails'

import 'dotenv/config'

const app = new Hono()

app.route('/tournaments',tournamentsRoutes)
app.route('/tournaments/:id', tournamentDetailsRoutes)

app.get('/', (c) => c.text('Supabase + Hono API running ✔'))

const PORT = process.env.PORT || 3000

Bun.serve({
  port: PORT,
  fetch: app.fetch,
})

console.log(`Server running on http://localhost:${PORT}`)