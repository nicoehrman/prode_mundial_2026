import { createClient } from '@/lib/supabase/server'
import type { Partido } from '@/lib/types'
import { bandera } from '@/lib/flags'
import clsx from 'clsx'

export const revalidate = 60

type Grupo = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L'
const GRUPOS: Grupo[] = ['A','B','C','D','E','F','G','H','I','J','K','L']

function calcularTablaGrupo(partidos: Partido[]) {
  const equipos = new Set<string>()
  partidos.forEach(p => { equipos.add(p.equipo_local); equipos.add(p.equipo_visitante) })
  const tabla = new Map<string, any>()
  equipos.forEach(eq => tabla.set(eq, { nombre: eq, pts:0, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0 }))
  partidos.forEach(p => {
    if (!p.resultado_cargado || p.goles_local === null || p.goles_visitante === null) return
    const gl = p.goles_local, gv = p.goles_visitante
    const loc = tabla.get(p.equipo_local)!
    const vis = tabla.get(p.equipo_visitante)!
    loc.pj++; vis.pj++; loc.gf += gl; loc.gc += gv; vis.gf += gv; vis.gc += gl
    if (gl > gv) { loc.pts += 3; loc.pg++; vis.pp++ }
    else if (gl < gv) { vis.pts += 3; vis.pg++; loc.pp++ }
    else { loc.pts++; loc.pe++; vis.pts++; vis.pe++ }
  })
  return Array.from(tabla.values())
    .map(t => ({ ...t, dg: t.gf - t.gc }))
    .sort((a: any, b: any) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf)
}

export default async function GruposPage() {
  const supabase = await createClient()
  const { data: partidos } = await supabase
    .from('partidos').select('*').eq('fase', 'grupos').order('kickoff_utc')
  const ps = (partidos as Partido[]) ?? []

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="font-display text-3xl tracking-wider text-gold-400">FASE DE GRUPOS</h1>
        <p className="text-white/40 text-xs mt-0.5">
          {ps.filter(p => p.resultado_cargado).length} de {ps.length} partidos jugados
        </p>
      </div>
      {GRUPOS.map(grupo => {
        const pg = ps.filter(p => p.grupo === grupo)
        const tabla = calcularTablaGrupo(pg)
        const jugados = pg.filter(p => p.resultado_cargado).length
        return (
          <div key={grupo} className="card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-gold-500/8 to-transparent">
              <span className="font-display text-lg tracking-wider text-gold-400">GRUPO {grupo}</span>
              <span className="text-white/30 text-[10px]">{jugados}/6</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['#','Equipo','PJ','G','E','P','DG','Pts'].map(h => (
                    <th key={h} className={`py-1.5 text-[10px] text-white/25 font-medium ${h === 'Equipo' ? 'text-left px-1' : h === '#' ? 'text-left px-3' : 'text-center px-1'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tabla.map((f: any, idx: number) => (
                  <tr key={f.nombre} className={clsx(idx < 2 && jugados > 0 && 'bg-green-500/5')}>
                    <td className="px-3 py-2">
                      <span className={clsx('text-xs font-bold', idx === 0 ? 'text-gold-400' : idx === 1 ? 'text-white/50' : 'text-white/20')}>{idx+1}</span>
                    </td>
                    <td className="px-1 py-2 text-white text-sm font-medium">{bandera(f.nombre)} {f.nombre}</td>
                    <td className="text-center px-1 py-2 text-white/40 text-xs">{f.pj}</td>
                    <td className="text-center px-1 py-2 text-white/40 text-xs">{f.pg}</td>
                    <td className="text-center px-1 py-2 text-white/40 text-xs">{f.pe}</td>
                    <td className="text-center px-1 py-2 text-white/40 text-xs">{f.pp}</td>
                    <td className={clsx('text-center px-1 py-2 text-xs font-medium', f.dg > 0 ? 'text-green-400' : f.dg < 0 ? 'text-red-400' : 'text-white/25')}>
                      {f.dg > 0 ? `+${f.dg}` : f.dg}
                    </td>
                    <td className="text-center px-2 py-2"><span className="text-gold-400 font-bold">{f.pts}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-white/5">
              {pg.map(p => (
                <div key={p.id} className="flex items-center justify-between px-4 py-2 border-b border-white/3 last:border-0">
                  <span className="text-white/60 text-xs flex-1 text-right pr-2">{bandera(p.equipo_local)} {p.equipo_local}</span>
                  <span className={clsx('text-xs font-bold px-2 shrink-0 min-w-[52px] text-center', p.resultado_cargado ? 'text-white' : 'text-white/20')}>
                    {p.resultado_cargado ? `${p.goles_local} — ${p.goles_visitante}` : '- — -'}
                  </span>
                  <span className="text-white/60 text-xs flex-1 pl-2">{p.equipo_visitante} {bandera(p.equipo_visitante)}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
