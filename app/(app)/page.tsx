import { createClient } from '@/lib/supabase/server'
import type { Partido } from '@/lib/types'
import { bandera } from '@/lib/flags'
import clsx from 'clsx'

export const revalidate = 60

type Grupo = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L'
const GRUPOS: Grupo[] = ['A','B','C','D','E','F','G','H','I','J','K','L']

interface FilaTabla {
  nombre: string
  pts: number; pj: number; pg: number; pe: number; pp: number
  gf: number; gc: number; dg: number
}

function calcularTablaGrupo(partidos: Partido[]): FilaTabla[] {
  const equipos = new Set<string>()
  partidos.forEach(p => { equipos.add(p.equipo_local); equipos.add(p.equipo_visitante) })

  const tabla = new Map<string, FilaTabla>()
  equipos.forEach(eq => tabla.set(eq, { nombre: eq, pts:0, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, dg:0 }))

  partidos.forEach(p => {
    if (!p.resultado_cargado || p.goles_local === null || p.goles_visitante === null) return
    const gl = p.goles_local, gv = p.goles_visitante
    const loc = tabla.get(p.equipo_local)!
    const vis = tabla.get(p.equipo_visitante)!
    loc.pj++; vis.pj++
    loc.gf += gl; loc.gc += gv
    vis.gf += gv; vis.gc += gl
    if (gl > gv)      { loc.pts += 3; loc.pg++; vis.pp++ }
    else if (gl < gv) { vis.pts += 3; vis.pg++; loc.pp++ }
    else              { loc.pts++; loc.pe++; vis.pts++; vis.pe++ }
  })

  return Array.from(tabla.values())
    .map(t => ({ ...t, dg: t.gf - t.gc }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf)
}

export default async function GruposPage() {
  const supabase = await createClient()
  const { data: partidos } = await supabase
    .from('partidos')
    .select('*')
    .eq('fase', 'grupos')
    .order('kickoff_utc')

  const ps = (partidos as Partido[]) ?? []
  const totalJugados = ps.filter(p => p.resultado_cargado).length

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="font-display text-3xl tracking-wider text-gold-400">FASE DE GRUPOS</h1>
        <p className="text-white/40 text-xs mt-0.5">
          {totalJugados} de {ps.length} partidos jugados · Se actualiza automáticamente
        </p>
      </div>

      {/* 12 grupos */}
      {GRUPOS.map(grupo => {
        const partidosGrupo = ps.filter(p => p.grupo === grupo)
        const tabla = calcularTablaGrupo(partidosGrupo)
        const jugados = partidosGrupo.filter(p => p.resultado_cargado).length

        return (
          <div key={grupo} className="card overflow-hidden">
            {/* Header grupo */}
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between
                            bg-gradient-to-r from-gold-500/8 to-transparent">
              <span className="font-display text-lg tracking-wider text-gold-400">
                GRUPO {grupo}
              </span>
              <span className="text-white/30 text-[10px]">{jugados}/6 jugados</span>
            </div>

            {/* Tabla */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-3 py-1.5 text-[10px] text-white/25 font-medium">#</th>
                  <th className="text-left px-1 py-1.5 text-[10px] text-white/25 font-medium">Equipo</th>
                  <th className="text-center px-1 py-1.5 text-[10px] text-white/25 font-medium">PJ</th>
                  <th className="text-center px-1 py-1.5 text-[10px] text-white/25 font-medium">G</th>
                  <th className="text-center px-1 py-1.5 text-[10px] text-white/25 font-medium">E</th>
                  <th className="text-center px-1 py-1.5 text-[10px] text-white/25 font-medium">P</th>
                  <th className="text-center px-1 py-1.5 text-[10px] text-white/25 font-medium">DG</th>
                  <th className="text-center px-2 py-1.5 text-[10px] text-gold-400 font-bold">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tabla.map((fila, idx) => (
                  <tr key={fila.nombre}
                    className={clsx('transition-colors', idx < 2 && jugados > 0 && 'bg-green-500/5')}>
                    <td className="px-3 py-2.5">
                      <span className={clsx('text-xs font-bold',
                        idx === 0 ? 'text-gold-400' : idx === 1 ? 'text-white/50' : 'text-white/20'
                      )}>{idx + 1}</span>
                    </td>
                    <td className="px-1 py-2.5">
                      <span className="text-white text-sm font-medium">
                        {bandera(fila.nombre)} {fila.nombre}
                      </span>
                    </td>
                    <td className="text-center px-1 py-2.5 text-white/40 text-xs">{fila.pj}</td>
                    <td className="text-center px-1 py-2.5 text-white/40 text-xs">{fila.pg}</td>
                    <td className="text-center px-1 py-2.5 text-white/40 text-xs">{fila.pe}</td>
                    <td className="text-center px-1 py-2.5 text-white/40 text-xs">{fila.pp}</td>
                    <td className={clsx('text-center px-1 py-2.5 text-xs font-medium',
                      fila.dg > 0 ? 'text-green-400' : fila.dg < 0 ? 'text-red-400' : 'text-white/25'
                    )}>
                      {fila.dg > 0 ? `+${fila.dg}` : fila.dg}
                    </td>
                    <td className="text-center px-2 py-2.5">
                      <span className="text-gold-400 font-bold">{fila.pts}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Partidos del grupo */}
            <div className="border-t border-white/5">
              {partidosGrupo.map(p => (
                <div key={p.id}
                  className="flex items-center justify-between px-4 py-2 border-b border-white/3 last:border-0">
                  <span className="text-white/60 text-xs truncate flex-1 text-right pr-2">
                    {bandera(p.equipo_local)} {p.equipo_local}
                  </span>
                  <span className={clsx(
                    'text-xs font-bold px-2 shrink-0 min-w-[52px] text-center',
                    p.resultado_cargado ? 'text-white' : 'text-white/20'
                  )}>
                    {p.resultado_cargado
                      ? `${p.goles_local} — ${p.goles_visitante}`
                      : '- — -'
                    }
                  </span>
                  <span className="text-white/60 text-xs truncate flex-1 pl-2">
                    {p.equipo_visitante} {bandera(p.equipo_visitante)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <p className="text-white/15 text-[10px] text-center pb-4">
        🟢 Los dos primeros de cada grupo clasifican directamente
      </p>
    </div>
  )
}
