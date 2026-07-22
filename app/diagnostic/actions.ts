'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createCarnet(formData: any) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Authentication required')
  }

  // 1. Create building
  const { data: building, error: buildingError } = await supabase
    .from('buildings')
    .upsert({
      user_id: user.id,
      nom: formData.nom || 'Mon bâtiment',
      adresse: formData.address,
      annee: formData.constructionYear,
      surface: formData.surface,
      type: formData.buildingType,
      score: formData.score,
      createdAt: new Date().toISOString()
    })
    .select()
    .single()

  if (buildingError) throw buildingError

  // 2. Create diagnostic
  const { error: diagError } = await supabase
    .from('diagnostics')
    .insert({
      building_id: building.id,
      score: formData.score,
      health_level: formData.healthLevel,
      data: formData.allParams
    })

  if (diagError) throw diagError

  redirect('/dashboard')
}
