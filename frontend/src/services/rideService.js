import { supabase } from '../integrations/supabase/client.js'

/**
 * Create a new ride.
 * Caller must pass `host_id` (= auth.uid()) and `host_name` — RLS enforces
 * host_id = auth.uid() on insert, so we also validate client-side for a
 * cleaner error message.
 *
 * seats_available is computed server-side by a BEFORE INSERT trigger.
 */
export async function createRide({
  host_id,
  host_name,
  destination,
  trip_type,
  departure_time,
  total_seats,
  cost_per_person,
  whatsapp_number,
}) {
  const payload = {
    host_id,
    host_name,
    destination: destination.trim(),
    trip_type,
    departure_time,
    total_seats: Number(total_seats),
    cost_per_person:
      cost_per_person === '' || cost_per_person === null || cost_per_person === undefined
        ? null
        : Number(cost_per_person),
    whatsapp_number: whatsapp_number ? whatsapp_number.trim() : null,
    status: 'open',
  }
  const { data, error } = await supabase
    .from('rides')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

/**
 * List rides. Default = all 'open' rides ordered by departure_time asc.
 * Optional filters:
 *   - from, to          ISO strings for departure_time range
 *   - destination       ILIKE substring match
 *   - trip_type         enum value or 'all'
 *   - minSeatsAvailable integer
 *   - includeNonOpen    boolean (defaults false)
 */
export async function listRides(filters = {}) {
  let query = supabase
    .from('rides')
    .select('*')
    .order('departure_time', { ascending: true })

  if (!filters.includeNonOpen) {
    query = query.eq('status', 'open')
  }
  if (filters.from) query = query.gte('departure_time', filters.from)
  if (filters.to) query = query.lte('departure_time', filters.to)
  if (filters.destination && filters.destination.trim()) {
    query = query.ilike('destination', `%${filters.destination.trim()}%`)
  }
  if (filters.trip_type && filters.trip_type !== 'all') {
    query = query.eq('trip_type', filters.trip_type)
  }
  if (typeof filters.minSeatsAvailable === 'number' && filters.minSeatsAvailable > 0) {
    query = query.gte('seats_available', filters.minSeatsAvailable)
  }

  const { data, error } = await query
  if (error) {
    console.error('[rideService] listRides query failed:', error)
  }
  return { data: data ?? [], error }
}

export async function getRide(rideId) {
  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .eq('ride_id', rideId)
    .maybeSingle()
  return { data, error }
}

/** Fetch the current user's public.users profile row. */
export async function getMyProfile(uid) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('uid', uid)
    .maybeSingle()
  return { data, error }
}

/** Fetch any user's public profile row by uid. */
export async function getProfileByUid(uid) {
  const { data, error } = await supabase
    .from('users')
    .select('uid, name, email, photo_url, rides_posted, rides_joined, created_at')
    .eq('uid', uid)
    .maybeSingle()
  return { data, error }
}

/** List all rides hosted by a user (any status), newest departure first. */
export async function listRidesByHost(uid) {
  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .eq('host_id', uid)
    .order('departure_time', { ascending: false })
  return { data: data ?? [], error }
}

// ---------------------------------------------------------------------------
// Join flow (Phase 4)
// ---------------------------------------------------------------------------

/**
 * List all passenger rows for a ride, with the embedded user row so we can
 * show names. RLS scopes visibility: host sees all rows, a non-host user
 * sees only their own row.
 */
export async function listRidePassengers(rideId) {
  const { data, error } = await supabase
    .from('ride_passengers')
    .select('ride_id, user_id, status, created_at, user:users!inner(uid,name,email)')
    .eq('ride_id', rideId)
    .order('created_at', { ascending: true })
  return { data: data ?? [], error }
}

/** Passenger requests to join a ride — inserts a pending row. */
export async function requestToJoin(rideId, userId) {
  const { data, error } = await supabase
    .from('ride_passengers')
    .insert({ ride_id: rideId, user_id: userId, status: 'pending' })
    .select()
    .single()
  return { data, error }
}

/** Host accepts/declines (or flips self-confirmed) a passenger. */
export async function setPassengerStatus(rideId, userId, status) {
  const { data, error } = await supabase
    .from('ride_passengers')
    .update({ status })
    .eq('ride_id', rideId)
    .eq('user_id', userId)
    .select()
    .maybeSingle()
  return { data, error }
}

/** Passenger withdraws — host can also remove a passenger. */
export async function removePassenger(rideId, userId) {
  const { error } = await supabase
    .from('ride_passengers')
    .delete()
    .eq('ride_id', rideId)
    .eq('user_id', userId)
  return { error }
}

// ---------------------------------------------------------------------------
// My Dashboard queries
// ---------------------------------------------------------------------------

/**
 * All rides hosted by a user. Embeds passenger rows so the dashboard can
 * show pending / confirmed counts without a second round-trip.
 */
export async function listMyRidesAsHost(userId) {
  const { data, error } = await supabase
    .from('rides')
    .select('*, passengers:ride_passengers(status)')
    .eq('host_id', userId)
    .order('departure_time', { ascending: true })
  return { data: data ?? [], error }
}

/**
 * All rides a user has requested/joined, with the embedded ride row.
 * Ordered by the join request creation time (newest first).
 */
export async function listMyRidesAsPassenger(userId) {
  const { data, error } = await supabase
    .from('ride_passengers')
    .select('status, created_at, ride:rides!inner(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data: data ?? [], error }
}

/** Toggle a ride's status (host-only — RLS enforced). */
export async function updateRideStatus(rideId, status) {
  const { data, error } = await supabase
    .from('rides')
    .update({ status })
    .eq('ride_id', rideId)
    .select()
    .maybeSingle()
  return { data, error }
}
