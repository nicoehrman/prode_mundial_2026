import { createClient } from '@/lib/supabase/server'
import PronosticosClient from '@/components/PronosticosClient'
import type { Partido, Pronostico, PronosticoCampeon, PronosticoGoleador, TorneoResultado } from '@/lib/types'

export default async function PronosticosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: partidos },
    { data: pronosticos },
    { data: campeon },
    { data: goleador },
    { data: torneoArr },
  ] = await Promise.all([
    supabase.from('partidos').select('*').order('kickoff_utc'),
    supabase.from('pronosticos').select('*').eq('user_id', user.id),
    supabase.from('pronostico_campeon').select('*').eq('user_id', user.id).single(),
    supabase.from('pronostico_goleador').select('*').eq('user_id', user.id).single(),
    supabase.from('torneo_resultado').select('*').eq('id', 1).single(),
  ])

  const torneoResultado: TorneoResultado = torneoArr?.data ?? {
    campeon_real: null, goleador_real: null,
    goleador_definido: false, campeon_definido: false,
  }

  return (
    <PronosticosClient
      userId={user.id}
      partidos={(partidos as Partido[]) ?? []}
      pronosticosIniciales={(pronosticos as Pronostico[]) ?? []}
      campeonInicial={campeon?.data as PronosticoCampeon ?? null}
      goleadorInicial={goleador?.data as PronosticoGoleador ?? null}
      torneoResultado={torneoResultado}
    />
  )
}
