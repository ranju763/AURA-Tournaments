import { Hono } from 'hono'
import { redis } from '../libs/redis'
import { ServerWebSocket } from 'bun'

export const liveScoreRoutes = new Hono()

// Keep track of connected clients
export const clients = new Set<ServerWebSocket>()

// HTTP routes
liveScoreRoutes.get('/', (c) => c.text('Supabase + Hono API running ✔'))

liveScoreRoutes.post('/init-score', async (c) => {
  const { match_id } = await c.req.json() as { match_id: string }
  await redis.hmset(`match:${match_id}`, { team_a: 0, team_b: 0 })
  return c.json({ success: true })
})

liveScoreRoutes.post('/update-score', async (c) => {
  const { match_id, team, increment } = await c.req.json() as {
    match_id: string
    team: 'A' | 'B'
    increment: number
  }

  const key = `match:${match_id}`
  const scoreKey = team === 'A' ? 'team_a' : 'team_b'

  await redis.hincrby(key, scoreKey, increment)
  const score = await redis.hgetall(key)

  // Broadcast updated score to all connected clients
  clients.forEach((ws) => {
    if (ws.readyState === 1) { // OPEN
      ws.send(JSON.stringify({ match_id, score }))
    }
  })

  return c.json({ success: true, score })
})
