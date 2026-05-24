import { createClient } from '@/lib/supabase/server'
import PartidosClient from '@/components/PartidosClient'
import type { Partido, Pronostico } from '@/lib/types'

export const revalidate = 60

export default async function PartidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: partidos },
    { data: misPronosticos },
    { data: todosPronosticos },
    { data: perfiles },
  ] = await Promise.all([
    supabase.from('partidos').select('*').order('kickoff_utc'),
    supabase.from('pronosticos').select('*').eq('user_id', user!.id),
    supabase.from('pronosticos').select('*'),
    supabase.from('perfiles').select('id, nombre').order('nombre'),
  ])

  return (
    <PartidosClient
      partidos={(partidos as Partido[]) ?? []}
      misPronosticos={(misPronosticos as Pronostico[]) ?? []}
      todosPronosticos={(todosPronosticos as Pronostico[]) ?? []}
      perfiles={(perfiles as Array<{id:string;nombre:string}>) ?? []}
      userId={user!.id}
    />
  )
}
