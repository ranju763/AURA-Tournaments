import { Hono } from 'hono'
import { supabase } from '../libs/supabase'

export const tournamentRoutes = new Hono()

tournamentRoutes.get('/', async (c) => {
  try {
    // 1️⃣ Get player ID from header
    const playerId = c.req.header('Authorization')
    if (!playerId) return c.json({ error: 'Missing player token' }, 400)

    // 2️⃣ Fetch player info
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, dob, gender')
      .eq('id', playerId)
      .single()

    if (playerError || !player) return c.json({ error: 'Player not found' }, 404)

    const today = new Date()
    const birthDate = new Date(player.dob)
    const age = today.getFullYear() - birthDate.getFullYear()
    const gender = player.gender.toLowerCase() // 'male' or 'female'

    // 3️⃣ Fetch tournaments with venue, match_format, registrations
    const { data: tournaments, error: tourError } = await supabase
      .from('tournaments')
      .select(`
        id,
        name,
        venue (
          id,
          name,
          address
        ),
        image_url,
        start_time,
        end_time,
        capacity,
        match_format (
          total_rounds,
          max_age,
          eligible_gender
        ),
        registrations!left (
          player_id
        )
      `)

    if (tourError) return c.json({ error: tourError.message }, 500)

    // 4️⃣ Map tournaments with `registered`, `eligible`, `total_registered`
    const formatted = tournaments.map((t: any) => {
      const maxAge = t.match_format?.max_age ?? 100
      const eligibleGender = t.match_format?.eligible_gender ?? 'MW'

      // Eligibility logic exactly like your SQL CASE
      const isAgeEligible = age <= maxAge
      const isGenderEligible =
        eligibleGender === 'MW' ||
        (eligibleGender === 'M' && gender === 'male') ||
        (eligibleGender === 'W' && gender === 'female')

      const eligible = isAgeEligible && isGenderEligible

      // Check if this player is registered
      const registered = t.registrations?.some((r: any) => r.player_id === playerId) ?? false

      return {
        id: t.id,
        name: t.name,
        venue: {
          name: t.venue?.name,
          address: t.venue?.address,
        },
        image_url: t.image_url,
        start_date: t.start_time,
        end_date: t.end_time,
        capacity: t.capacity,
        match_format: t.match_format,
        total_registered: t.registrations?.length ?? 0,
        registered,
        eligible,
      }
    })

    return c.json({ data: { tournaments: formatted } })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})
