import { createClient } from '@/lib/supabase/server'
import { calcularTabla } from '@/lib/scoring'
import type { Perfil, Partido, Pronostico, PronosticoCampeon, PronosticoGoleador, TorneoResultado } from '@/lib/types'
import { FASES_LABEL } from '@/lib/types'
import { Trophy, Zap, Target, TrendingUp } from 'lucide-react'

export const revalidate = 60 // revalidar cada 60 segundos

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: perfiles },
    { data: partidos },
    { data: pronosticos },
    { data: campeonPreds },
    { data: goleadorPreds },
    { data: torneoArr },
  ] = await Promise.all([
    supabase.from('perfiles').select('*').order('nombre'),
    supabase.from('partidos').select('*').order('kickoff_utc'),
    supabase.from('pronosticos').select('*'),
    supabase.from('pronostico_campeon').select('*'),
    supabase.from('pronostico_goleador').select('*'),
    supabase.from('torneo_resultado').select('*').eq('id', 1).single(),
  ])

  const torneoResultado: TorneoResultado = torneoArr?.data ?? {
    campeon_real: null,
    goleador_real: null,
    goleador_definido: false,
    campeon_definido: false,
  }

  const tabla = calcularTabla({
    partidos: (partidos as Partido[]) ?? [],
    pronosticos: (pronosticos as Pronostico[]) ?? [],
    perfiles: (perfiles as Perfil[]) ?? [],
    pronosticosCampeon: (campeonPreds as PronosticoCampeon[]) ?? [],
    pronosticosGoleador: (goleadorPreds as PronosticoGoleador[]) ?? [],
    torneoResultado,
  })

  const totalPartidosJugados = (partidos as Partido[])?.filter(p => p.resultado_cargado).length ?? 0
  const posicion = tabla.findIndex(u => u.user_id === user?.id) + 1

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wider text-gold-400">TABLA</h1>
          <p className="text-white/40 text-xs mt-0.5">
            {totalPartidosJugados} de {(partidos as Partido[])?.length ?? 104} partidos jugados
          </p>
        </div>
        {posicion > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-white">#{posicion}</div>
            <div className="text-white/40 text-xs">tu posición</div>
          </div>
        )}
      </div>

      {/* Stats cards */}
      {posicion > 0 && tabla.length > 0 && (() => {
        const me = tabla.find(u => u.user_id === user?.id)
        if (!me) return null
        return (
          <div className="grid grid-cols-3 gap-2">
            <div className="card p-3 text-center">
              <p className="text-gold-400 font-bold text-xl">{me.total}</p>
              <p className="text-white/40 text-[10px] mt-0.5">PUNTOS</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-white font-bold text-xl">{me.exacto_count}</p>
              <p className="text-white/40 text-[10px] mt-0.5">EXACTOS</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-white font-bold text-xl">{me.ganador_count}</p>
              <p className="text-white/40 text-[10px] mt-0.5">GANADORES</p>
            </div>
          </div>
        )
      })()}

      {/* Leaderboard */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
          <Trophy size={14} className="text-gold-400" />
          <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            Clasificación
          </span>
        </div>

        {tabla.length === 0 ? (
          <div className="py-12 text-center text-white/30 text-sm">
            Aún no hay participantes
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {tabla.map((usuario, idx) => {
              const isMe = usuario.user_id === user?.id
              const pos = idx + 1
              const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : null

              return (
                <div
                  key={usuario.user_id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isMe ? 'bg-gold-500/8 border-l-2 border-gold-500' : ''
                  }`}
                >
                  {/* Posición */}
                  <div className="w-7 text-center shrink-0">
                    {medal ? (
                      <span className="text-base">{medal}</span>
                    ) : (
                      <span className="text-white/30 text-sm font-mono">#{pos}</span>
                    )}
                  </div>

                  {/* Nombre */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm truncate ${
                      isMe ? 'text-gold-300' : 'text-white'
                    }`}>
                      {usuario.nombre}
                      {isMe && <span className="text-gold-500/60 text-xs ml-1.5">(vos)</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-white/30 text-[10px]">{usuario.exacto_count} exactos</span>
                      {usuario.upset_count > 0 && (
                        <span className="text-orange-400/60 text-[10px] flex items-center gap-0.5">
                          <Zap size={8} />
                          {usuario.upset_count}
                        </span>
                      )}
                      {usuario.acierto_campeon && (
                        <span className="text-gold-400/60 text-[10px]">🏆 campeon</span>
                      )}
                    </div>
                  </div>

                  {/* Puntos */}
                  <div className="text-right shrink-0">
                    <div className={`font-bold text-lg ${
                      isMe ? 'text-gold-400' : 'text-white'
                    }`}>
                      {usuario.total}
                    </div>
                    <div className="text-white/25 text-[10px]">pts</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Nota desempate */}
      <p className="text-white/20 text-[10px] text-center leading-relaxed">
        Desempate: campeón → exactos 5+ goles → exactos → diferencia → ganador/empate
      </p>
    </div>
  )
}
