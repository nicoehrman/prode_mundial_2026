import { createClient } from '@/lib/supabase/server'
import ResultadosClient from '@/components/ResultadosClient'
import type { Partido } from '@/lib/types'

export default async function ResultadosPage() {
  const supabase = await createClient()
  const { data: partidos } = await supabase
    .from('partidos')
    .select('*')
    .order('kickoff_utc')

  return <ResultadosClient partidos={(partidos as Partido[]) ?? []} />
}
