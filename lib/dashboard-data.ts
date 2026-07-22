import { createClient } from '@/lib/supabase/server'

export async function getDashboardData() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { user: null, carnet: null, error: 'User not authenticated' }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('prenom, nom')
    .eq('id', user.id)
    .single()

  const { data: carnet, error: carnetError } = await supabase
    .from('buildings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return {
    user: profile ? { ...profile, email: user.email } : null,
    carnet: carnet || null,
    error: profileError || carnetError ? 'Error fetching data' : null
  }
}
