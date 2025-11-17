import { Hono } from 'hono'
import { supabase } from '../libs/supabase'

export const userRoutes = new Hono()

// Get all users
userRoutes.get('/', async (c) => {
  const { data, error } = await supabase.from('players').select('*')
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// Create a user
userRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { data, error } = await supabase.from('players').insert(body)
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})
