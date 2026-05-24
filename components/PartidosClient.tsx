'use client'
import { useState } from 'react'
import type { Partido, Pronostico } from '@/lib/types'
import { FASES_LABEL, FASES_ORDEN } from '@/lib/types'
import { calcularPuntosPartido } from '@/lib/scoring'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  partidos: Partido[]
  misPronosticos: Pronostico[]
  todosPronosticos: Pronostico[]
  perfiles: Array<{id:string;nombre:string}>
  userId: string
}

export default function PartidosClient({ partidos, misPronosticos, todosPronosticos, perfiles, userId }: Props) {
  const [selectedFase, setSelectedFase] = useState('grupos')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const misPronosIdx = new Map(misPronosticos.map(p => [p.partido_id, p]))
  const todosIdx = new Map<number, Map<string, Pronostico>>()
  for (const p of todosPronosticos) {
    if (!todosIdx.has(p.partido_id)) todosIdx.set(p.partido_id, new Map())
    todosIdx.get(p.partido_id)!.set(p.user_id, p)
  }

  const fasesDisponibles = FASES_ORDEN.filter(f => partidos.some(p => p.fase === f))
  const partidosFase = partidos.filter(p => p.fase === selectedFase)

  // Conteo de partidos jugados en la fase
  const jugados = partidosFase.filter(p => p.resultado_cargado).length

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="font-display text-3xl tracking-wider text-gold-400">PARTIDOS</h1>
        <p className="text-white/40 text-xs mt-0.5">
          Resultados y pronósticos de todos
        </p>
      </div>

      {/* Selector de fase */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {fasesDisponibles.map(fase => {
          const jug = partidos.filter(p => p.fase === fase && p.resultado_cargado).length
          const tot = partidos.filter(p => p.fase === fase).length
          return (
            <button
              key={fase}
              onClick={() => setSelectedFase(fase)}
              className={clsx(
                'shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all',
                selectedFase === fase
                  ? 'bg-gold-500 text-navy-900'
                  : 'border border-white/15 text-white/50 hover:border-white/30 hover:text-white/70'
              )}
            >
              {FASES_LABEL[fase as keyof typeof FASES_LABEL]}
              {jug > 0 && (
                <span className="ml-1.5 opacity-60">{jug}/{tot}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Partidos */}
      <div className="space-y-2">
        {partidosFase.map(partido => {
          const miPronos = misPronosIdx.get(partido.id) ?? null
          const todosPartidoPronos = todosIdx.get(partido.id) ?? new Map()
          const mispts = calcularPuntosPartido(partido, miPronos)
          const expanded = expandedId === partido.id
          const kickoff = new Date(partido.kickoff_utc)

          return (
            <div key={partido.id} className="card overflow-hidden">
              {/* Row principal */}
              <button
                className="w-full px-4 py-3 flex items-center gap-3 text-left"
                onClick={() => setExpandedId(expanded ? null : partido.id)}
              >
                {/* Equipos y resultado */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    {partido.grupo && (
                      <span className="text-[9px] font-bold text-gold-500/60 bg-gold-500/10 px-1 py-0.5 rounded">
                        G{partido.grupo}
                      </span>
                    )}
                    <span className="text-white/30 text-[10px]">
                      {format(kickoff, "d MMM", { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium truncate max-w-[90px]">
                      {partido.equipo_local}
                    </span>
                    <span className="text-white/40 text-xs shrink-0">
                      {partido.resultado_cargado
                        ? `${partido.goles_local} - ${partido.goles_visitante}`
                        : 'vs'
                      }
                    </span>
                    <span className="text-white text-sm font-medium truncate max-w-[90px]">
                      {partido.equipo_visitante}
                    </span>
                  </div>
                </div>

                {/* Mi pronóstico y puntos */}
                <div className="flex items-center gap-2 shrink-0">
                  {miPronos && (
                    <div className="text-right">
                      <div className="text-white/50 text-xs">
                        {miPronos.goles_local}-{miPronos.goles_visitante}
                      </div>
                      {partido.resultado_cargado && (
                        <div className={clsx('text-xs font-bold', mispts.total > 0 ? 'text-green-400' : 'text-white/20')}>
                          +{mispts.total}pt{mispts.total !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )}
                  {expanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                </div>
              </button>

              {/* Expanded: todos los pronósticos */}
              {expanded && partido.resultado_cargado && (
                <div className="border-t border-white/5 px-4 pb-3">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider mt-2 mb-2">
                    Pronósticos de todos
                  </p>
                  <div className="space-y-1.5">
                    {perfiles.map(perfil => {
                      const pronos = todosPartidoPronos.get(perfil.id) ?? null
                      const pts = calcularPuntosPartido(partido, pronos)
                      const isMe = perfil.id === userId
                      return (
                        <div key={perfil.id}
                          className={clsx('flex items-center justify-between py-1.5 px-2 rounded-lg',
                            isMe && 'bg-gold-500/8')}>
                          <span className={clsx('text-xs truncate max-w-[120px]',
                            isMe ? 'text-gold-300 font-semibold' : 'text-white/60')}>
                            {perfil.nombre}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-white/50 text-xs font-mono">
                              {pronos ? `${pronos.goles_local}-${pronos.goles_visitante}` : '—'}
                            </span>
                            <span className={clsx('text-xs font-bold w-8 text-right',
                              pts.total >= 3 ? 'text-gold-400' :
                              pts.total >= 1 ? 'text-green-400' : 'text-white/20')}>
                              {pronos ? `+${pts.total}` : '—'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Expanded pero sin resultado */}
              {expanded && !partido.resultado_cargado && (
                <div className="border-t border-white/5 px-4 py-3">
                  <p className="text-white/30 text-xs text-center">
                    Los pronósticos se revelan cuando hay resultado
                  </p>
                </div>
              )}
            </div>
          )
        })}

        {partidosFase.length === 0 && (
          <div className="card py-12 text-center text-white/30 text-sm">
            No hay partidos en esta fase
          </div>
        )}
      </div>
    </div>
  )
}
