import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Waitlist
export async function joinWaitlist(email: string) {
  const { error } = await supabase
    .from('waitlist')
    .insert({ email })
  return { error }
}

// Save building
export async function saveBuilding(building: {
  nom: string
  adresse: string
  annee: string
  surface: string
  type: string
  etages: string
  score: number
}) {
  const { data, error } = await supabase
    .from('buildings')
    .insert(building)
    .select()
    .single()
  return { data, error }
}

// Save diagnostic
export async function saveDiagnostic(diagnostic: {
  building_id?: string
  score: number
  health_level: string
  data: object
}) {
  const { data, error } = await supabase
    .from('diagnostics')
    .insert(diagnostic)
    .select()
    .single()
  return { data, error }
}

// Get buildings
export async function getBuildings() {
  const { data, error } = await supabase
    .from('buildings')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}