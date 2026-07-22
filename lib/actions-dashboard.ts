'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addWork(buildingId: string, workData: {
  title: string,
  date: string,
  cost: string,
  description: string,
  category: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('travaux')
    .insert({
      building_id: buildingId,
      ...workData,
      createdAt: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard')
  return data
}
