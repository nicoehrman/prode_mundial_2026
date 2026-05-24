import { createClient } from '@/lib/supabase/server'
import ParticipantesClient from '@/components/ParticipantesClient'
import type { Perfil } from '@/lib/types'

export default async function ParticipantesPage() {
  const supabase = await createClient()

  const [{ data: perfiles }, { data: pozoArr }] = await Promise.all([
    supabase.from('perfiles').select('*').order('nombre'),
    supabase.from('pozo_config').select('*').eq('id', 1).single(),
  ])

  return (
    <ParticipantesClient
      perfiles={(perfiles as Perfil[]) ?? []}
      inscripcion={pozoArr?.data?.monto_inscripcion ?? 5000}
    />
  )
}
