import { Hono } from 'hono'
import { tournamentRoutes } from './routes/tournaments'

import 'dotenv/config'

const app = new Hono()

app.route('/tournaments',tournamentRoutes)
app.get('/', (c) => c.text('Supabase + Hono API running ✔'))

const PORT = process.env.PORT || 3000

Bun.serve({
  port: PORT,
  fetch: app.fetch,
})

console.log(`Server running on http://localhost:${PORT}`)