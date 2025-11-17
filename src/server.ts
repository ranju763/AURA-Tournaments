import { Hono } from 'hono'
import { userRoutes } from './routes/users'
import 'dotenv/config'

const app = new Hono()

app.route('/users', userRoutes)
app.get('/', (c) => c.text('Supabase + Hono API running ✔'))

const PORT = process.env.PORT || 3000

Bun.serve({
  port: PORT,
  fetch: app.fetch,
})

console.log(`Server running on http://localhost:${PORT}`)