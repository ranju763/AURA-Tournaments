import { Hono } from 'hono'
import { supabase } from '../libs/supabase'

export const tournamentDetailsRoutes = new Hono()

tournamentDetailsRoutes.get('/', async (c) => {
  try {
    // 1️⃣ Get player ID from header
    const playerId = c.req.header('Authorization')
    if (!playerId) return c.json({ error: 'Missing player token' }, 400)

    // 2️⃣ Get tournament ID from params
    const tournamentId = c.req.param('id')
    if (!tournamentId) return c.json({ error: 'Missing tournament ID' }, 400)

    // 3️⃣ Fetch player info
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, dob, gender')
      .eq('id', playerId)
      .single()
    if (playerError || !player) return c.json({ error: 'Player not found' }, 404)

    const today = new Date()
    const birthDate = new Date(player.dob)
    const age = today.getFullYear() - birthDate.getFullYear()
    const gender = player.gender.toLowerCase()

    // 4️⃣ Fetch tournament info
    const { data: tournaments, error: tournamentError } = await supabase
      .from('tournaments')
      .select(`
        id,
        name,
        image_url,
        start_time,
        end_time,
        capacity,
        venue ( id, name, address ),
        match_format ( id, total_rounds, max_age, eligible_gender ),
        host_id
      `)
      .eq('id', tournamentId)
      .single()
    if (tournamentError || !tournaments) return c.json({ error: 'Tournament not found' }, 404)

    const tournament = tournaments

    // 5️⃣ Fetch host info
    const { data: host } = await supabase
      .from('players')
      .select('id, username, user_id, photo_url')
      .eq('id', tournament.host_id)
      .single()

    // 6️⃣ Check if player is registered
    const { data: registration } = await supabase
      .from('registrations')
      .select('player_id')
      .eq('tournament_id', tournament.id)
      .eq('player_id', playerId)
      .single()
    const registered = !!registration

    // 7️⃣ Calculate eligibility
    const matchFormat = tournament.match_format?.[0]  // get first element safely
    const eligibleGender = matchFormat?.eligible_gender ?? 'any'
    const isAgeEligible = age <= (matchFormat?.max_age ?? 100)


    const isGenderEligible =
      eligibleGender === 'MW' ||
      (eligibleGender === 'M' && gender === 'male') ||
      (eligibleGender === 'W' && gender === 'female')
    const eligible = isAgeEligible && isGenderEligible

    // 8️⃣ Fetch referees
    const { data: referees } = await supabase
      .from('tournaments_referee')
      .select(`
        player_id,
        players!inner(username, phone)
      `)
      .eq('tournament_id', tournament.id)

    // 9️⃣ Fetch total registrations
    const { count: totalRegistered } = await supabase
      .from('registrations')
      .select('player_id', { count: 'exact', head: true })
      .eq('tournament_id', tournament.id)

    // 10️⃣ Format response
    return c.json({
      data: {
        id: tournament.id,
        name: tournament.name,
        venue: tournament.venue,
        image_url: tournament.image_url,
        start_date: tournament.start_time,
        end_date: tournament.end_time,
        capacity: tournament.capacity,
        match_format: tournament.match_format,
        hosted_by: host,
        registered,
        eligible,
        referee: referees?.map((r) => ({
          player_id: r.player_id,
          name: r.players[0]?.username || null,
        phone: r.players[0]?.phone || null
        })),
        total_registered: totalRegistered || 0
      }
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})
