'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Partido } from '@/lib/types'
import { FASES_LABEL, FASES_ORDEN } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle, Lock, ChevronLeft, Save } from 'lucide-react'
import clsx from 'clsx'
import Link from 'next/link'

type Grupo = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L'
const GRUPOS: Grupo[] = ['A','B','C','D','E','F','G','H','I','J','K','L']

interface FilaTabla {
  nombre: string
  pts: number; pj: number; pg: number; pe: number; pp: number
  gf: number; gc: number; dg: number
}

function calcularTablaGrupo(
  partidos: Partido[],
  scores: Map<number, { local: string; visitante: string }>
): FilaTabla[] {
  const equipos = new Set<string>()
  partidos.forEach(p => { equipos.add(p.equipo_local); equipos.add(p.equipo_visitante) })

  const tabla = new Map<string, FilaTabla>()
  equipos.forEach(eq => tabla.set(eq, { nombre: eq, pts:0, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, dg:0 }))

  partidos.forEach(partido => {
    const score = scores.get(partido.id)
    // Usar resultado real si existe, sino el score local del input
    const localStr = partido.resultado_cargado
      ? String(partido.goles_local ?? '')
      : (score?.local ?? '')
    const visitanteStr = partido.resultado_cargado
      ? String(partido.goles_visitante ?? '')
      : (score?.visitante ?? '')

    if (!localStr || !visitanteStr) return
    const gl = parseInt(localStr)
    const gv = parseInt(visitanteStr)
    if (isNaN(gl) || isNaN(gv)) return

    const loc = tabla.get(partido.equipo_local)!
    const vis = tabla.get(partido.equipo_visitante)!
    loc.pj++; vis.pj++
    loc.gf += gl; loc.gc += gv
    vis.gf += gv; vis.gc += gl

    if (gl > gv)      { loc.pts += 3; loc.pg++; vis.pp++ }
    else if (gl < gv) { vis.pts += 3; vis.pg++; loc.pp++ }
    else              { loc.pts += 1; loc.pe++; vis.pts += 1; vis.pe++ }
  })

  return Array.from(tabla.values())
    .map(t => ({ ...t, dg: t.gf - t.gc }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf)
}

export default function ResultadosClient({ partidos }: { partidos: Partido[] }) {
  const supabase = createClient()
  const [modo, setModo] = useState<'grupos' | 'eliminatorias'>('grupos')
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<Grupo>('A')
  const [faseElim, setFaseElim] = useState('32avos')

  // Scores locales (lo que el admin está escribiendo en los inputs)
  const [scores, setScores] = useState<Map<number, { local: string; visitante: string }>>(
    new Map(partidos.map(p => [p.id, {
      local: p.goles_local !== null ? String(p.goles_local) : '',
      visitante: p.goles_visitante !== null ? String(p.goles_visitante) : '',
    }]))
  )
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved] = useState<Set<number>>(new Set())
  const [errors, setErrors] = useState<Map<number, string>>(new Map())

  function updateScore(id: number, field: 'local' | 'visitante', value: string) {
    setScores(prev => {
      const n = new Map(prev)
      const curr = n.get(id) ?? { local: '', visitante: '' }
      n.set(id, { ...curr, [field]: value })
      return n
    })
  }

  async function guardar(partido: Partido) {
    const sc = scores.get(partido.id)
    if (!sc) return
    const l = parseInt(sc.local)
    const v = parseInt(sc.visitante)
    if (isNaN(l) || isNaN(v) || l < 0 || v < 0) {
      setErrors(prev => new Map(prev).set(partido.id, 'Ingresá valores válidos'))
      return
    }
    setSaving(partido.id)
    setErrors(prev => { const n = new Map(prev); n.delete(partido.id); return n })

    const { error } = await supabase.from('partidos').update({
      goles_local: l, goles_visitante: v, resultado_cargado: true,
    }).eq('id', partido.id)

    if (error) {
      setErrors(prev => new Map(prev).set(partido.id, 'Error al guardar'))
    } else {
      setSaved(prev => new Set(prev).add(partido.id))
      setTimeout(() => setSaved(prev => { const n = new Set(prev); n.delete(partido.id); return n }), 3000)
    }
    setSaving(null)
  }

  async function limpiar(partido: Partido) {
    if (!confirm(`¿Limpiar resultado?`)) return
    await supabase.from('partidos').update({
      goles_local: null, goles_visitante: null, resultado_cargado: false,
    }).eq('id', partido.id)
    setScores(prev => { const n = new Map(prev); n.set(partido.id, { local: '', visitante: '' }); return n })
  }

  async function bloquearFase(fase: string) {
    if (!confirm(`¿Bloquear pronósticos de ${FASES_LABEL[fase as keyof typeof FASES_LABEL]}?`)) return
    const { error } = await supabase.from('partidos')
      .update({ bloqueo_manual: new Date().toISOString() })
      .eq('fase', fase).is('bloqueo_manual', null)
    if (!error) alert('✓ Fase bloqueada')
  }

  // Partidos del grupo seleccionado
  const partidosGrupo = useMemo(() =>
    partidos.filter(p => p.fase === 'grupos' && p.grupo === grupoSeleccionado)
      .sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()),
    [partidos, grupoSeleccionado]
  )

  // Tabla del grupo en tiempo real
  const tablaGrupo = useMemo(() =>
    calcularTablaGrupo(partidosGrupo, scores),
    [partidosGrupo, scores]
  )

  // Partidos eliminatorias
  const fasesElim = FASES_ORDEN.filter(f => f !== 'grupos' && partidos.some(p => p.fase === f))
  const partidosElim = partidos
    .filter(p => p.fase === faseElim)
    .sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime())

  // Estadísticas globales
  const cargados = partidos.filter(p => p.resultado_cargado).length

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-white/40 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-3xl tracking-wider text-gold-400">RESULTADOS</h1>
          <p className="text-white/40 text-xs">{cargados} de {partidos.length} partidos cargados</p>
        </div>
      </div>

      {/* Modo: Grupos vs Eliminatorias */}
      <div className="flex gap-2">
        {['grupos', 'eliminatorias'].map(m => (
          <button
            key={m}
            onClick={() => setModo(m as any)}
            className={clsx(
              'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
              modo === m
                ? 'bg-gold-500 text-navy-900'
                : 'border border-white/15 text-white/50 hover:text-white/70'
            )}
          >
            {m === 'grupos' ? 'Fase de Grupos' : 'Eliminatorias'}
          </button>
        ))}
      </div>

      {/* ══════════ MODO GRUPOS ══════════ */}
      {modo === 'grupos' && (
        <>
          {/* Selector de grupo */}
          <div className="grid grid-cols-6 gap-1.5">
            {GRUPOS.map(g => {
              const pg = partidos.filter(p => p.fase === 'grupos' && p.grupo === g)
              const carg = pg.filter(p => p.resultado_cargado).length
              const completo = carg === pg.length && carg > 0
              return (
                <button
                  key={g}
                  onClick={() => setGrupoSeleccionado(g)}
                  className={clsx(
                    'py-2 rounded-lg text-sm font-bold transition-all relative',
                    grupoSeleccionado === g
                      ? 'bg-gold-500 text-navy-900'
                      : completo
                        ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                        : 'border border-white/15 text-white/50 hover:text-white/70'
                  )}
                >
                  {g}
                  {carg > 0 && carg < pg.length && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tabla del grupo en tiempo real */}
          <div className="card overflow-hidden">
            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                Tabla Grupo {grupoSeleccionado}
              </span>
              <span className="text-white/30 text-[10px]">
                {partidos.filter(p => p.fase === 'grupos' && p.grupo === grupoSeleccionado && p.resultado_cargado).length}/6 jugados
              </span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-3 py-1.5 text-[10px] text-white/30 font-medium w-6">#</th>
                  <th className="text-left px-1 py-1.5 text-[10px] text-white/30 font-medium">Equipo</th>
                  <th className="text-center px-1 py-1.5 text-[10px] text-white/30 font-medium">PJ</th>
                  <th className="text-center px-1 py-1.5 text-[10px] text-white/30 font-medium">G</th>
                  <th className="text-center px-1 py-1.5 text-[10px] text-white/30 font-medium">E</th>
                  <th className="text-center px-1 py-1.5 text-[10px] text-white/30 font-medium">P</th>
                  <th className="text-center px-1 py-1.5 text-[10px] text-white/30 font-medium">GF</th>
                  <th className="text-center px-1 py-1.5 text-[10px] text-white/30 font-medium">GC</th>
                  <th className="text-center px-1 py-1.5 text-[10px] text-white/30 font-medium">DG</th>
                  <th className="text-center px-2 py-1.5 text-[10px] text-gold-400 font-bold">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tablaGrupo.map((fila, idx) => (
                  <tr key={fila.nombre}
                    className={clsx('transition-colors', idx < 2 && 'bg-green-500/5')}>
                    <td className="px-3 py-2">
                      <span className={clsx('text-xs font-bold',
                        idx === 0 ? 'text-gold-400' :
                        idx === 1 ? 'text-white/60' : 'text-white/25'
                      )}>{idx + 1}</span>
                    </td>
                    <td className="px-1 py-2">
                      <span className="text-white text-xs font-medium truncate block max-w-[90px]">
                        {fila.nombre}
                      </span>
                    </td>
                    <td className="text-center px-1 py-2 text-white/50 text-xs">{fila.pj}</td>
                    <td className="text-center px-1 py-2 text-white/50 text-xs">{fila.pg}</td>
                    <td className="text-center px-1 py-2 text-white/50 text-xs">{fila.pe}</td>
                    <td className="text-center px-1 py-2 text-white/50 text-xs">{fila.pp}</td>
                    <td className="text-center px-1 py-2 text-white/50 text-xs">{fila.gf}</td>
                    <td className="text-center px-1 py-2 text-white/50 text-xs">{fila.gc}</td>
                    <td className={clsx('text-center px-1 py-2 text-xs font-medium',
                      fila.dg > 0 ? 'text-green-400' : fila.dg < 0 ? 'text-red-400' : 'text-white/30'
                    )}>
                      {fila.dg > 0 ? `+${fila.dg}` : fila.dg}
                    </td>
                    <td className="text-center px-2 py-2">
                      <span className="text-gold-400 font-bold text-sm">{fila.pts}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-3 py-1.5 border-t border-white/5">
              <p className="text-[9px] text-white/20">🟢 Clasifican directo · La tabla se actualiza mientras cargás resultados</p>
            </div>
          </div>

          {/* Partidos del grupo */}
          <div className="space-y-2">
            {partidosGrupo.map((partido, idx) => {
              const sc = scores.get(partido.id) ?? { local: '', visitante: '' }
              const kickoff = new Date(partido.kickoff_utc)
              const fecha = format(kickoff, "d MMM · HH:mm", { locale: es })
              const fecha2 = format(kickoff, "EEE d MMM", { locale: es })

              // Separador de jornada
              const prevPartido = idx > 0 ? partidosGrupo[idx - 1] : null
              const esNuevaFecha = !prevPartido ||
                format(new Date(prevPartido.kickoff_utc), 'yyyy-MM-dd') !== format(kickoff, 'yyyy-MM-dd')

              return (
                <div key={partido.id}>
                  {esNuevaFecha && (
                    <div className="flex items-center gap-2 py-1">
                      <div className="h-px flex-1 bg-white/8" />
                      <span className="text-white/30 text-[10px] uppercase tracking-wider capitalize">
                        {fecha2}
                      </span>
                      <div className="h-px flex-1 bg-white/8" />
                    </div>
                  )}

                  <div className="card p-3">
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-white/25 text-[10px]">{fecha} UTC · {partido.estadio}</span>
                      {partido.resultado_cargado && (
                        <button onClick={() => limpiar(partido)}
                          className="text-red-400/50 text-[10px] hover:text-red-400">
                          Limpiar
                        </button>
                      )}
                    </div>

                    {/* Equipos + inputs */}
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-right text-white font-semibold text-sm leading-tight">
                        {partido.equipo_local}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number" min={0} max={20}
                          value={sc.local}
                          onChange={e => updateScore(partido.id, 'local', e.target.value)}
                          className="score-input"
                          placeholder="—"
                        />
                        <span className="text-white/20 text-xs">—</span>
                        <input
                          type="number" min={0} max={20}
                          value={sc.visitante}
                          onChange={e => updateScore(partido.id, 'visitante', e.target.value)}
                          className="score-input"
                          placeholder="—"
                        />
                      </div>
                      <span className="flex-1 text-left text-white font-semibold text-sm leading-tight">
                        {partido.equipo_visitante}
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="h-4">
                        {errors.get(partido.id) && (
                          <span className="text-red-400 text-[10px]">{errors.get(partido.id)}</span>
                        )}
                        {saved.has(partido.id) && (
                          <span className="text-green-400 text-[10px] flex items-center gap-1">
                            <CheckCircle size={10} /> Guardado
                          </span>
                        )}
                        {saving === partido.id && (
                          <span className="text-white/30 text-[10px]">Guardando...</span>
                        )}
                      </div>
                      <button
                        onClick={() => guardar(partido)}
                        disabled={saving === partido.id || !sc.local || !sc.visitante}
                        className={clsx(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
                          'transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                          partido.resultado_cargado
                            ? 'bg-white/10 text-white hover:bg-white/15'
                            : 'bg-gold-500 text-navy-900 hover:bg-gold-400'
                        )}
                      >
                        <Save size={11} />
                        {partido.resultado_cargado ? 'Actualizar' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ══════════ MODO ELIMINATORIAS ══════════ */}
      {modo === 'eliminatorias' && (
        <>
          {/* Selector de fase */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {fasesElim.length === 0 ? (
              <p className="text-white/30 text-sm py-4">
                Las fases eliminatorias aparecen cuando termina la fase de grupos
              </p>
            ) : fasesElim.map(fase => (
              <button
                key={fase}
                onClick={() => setFaseElim(fase)}
                className={clsx(
                  'shrink-0 px-3 py-2 rounded-full text-xs font-semibold transition-all',
                  faseElim === fase
                    ? 'bg-gold-500 text-navy-900'
                    : 'border border-white/15 text-white/50 hover:text-white/70'
                )}
              >
                {FASES_LABEL[fase as keyof typeof FASES_LABEL]}
              </button>
            ))}
          </div>

          {/* Botón bloquear fase */}
          {fasesElim.length > 0 && (
            <button onClick={() => bloquearFase(faseElim)}
              className="btn-danger w-full flex items-center justify-center gap-2 text-sm">
              <Lock size={14} />
              Bloquear pronósticos — {FASES_LABEL[faseElim as keyof typeof FASES_LABEL]}
            </button>
          )}

          {/* Partidos eliminatorias */}
          <div className="space-y-2">
            {partidosElim.map(partido => {
              const sc = scores.get(partido.id) ?? { local: '', visitante: '' }
              return (
                <div key={partido.id} className="card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/25 text-[10px]">
                      #{partido.match_number} · {format(new Date(partido.kickoff_utc), "d MMM", { locale: es })}
                    </span>
                    {partido.resultado_cargado && (
                      <button onClick={() => limpiar(partido)}
                        className="text-red-400/50 text-[10px] hover:text-red-400">Limpiar</button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-right text-white font-semibold text-sm">{partido.equipo_local}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input type="number" min={0} max={20} value={sc.local}
                        onChange={e => updateScore(partido.id, 'local', e.target.value)}
                        className="score-input" placeholder="—" />
                      <span className="text-white/20 text-xs">—</span>
                      <input type="number" min={0} max={20} value={sc.visitante}
                        onChange={e => updateScore(partido.id, 'visitante', e.target.value)}
                        className="score-input" placeholder="—" />
                    </div>
                    <span className="flex-1 text-left text-white font-semibold text-sm">{partido.equipo_visitante}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="h-4">
                      {saved.has(partido.id) && (
                        <span className="text-green-400 text-[10px] flex items-center gap-1">
                          <CheckCircle size={10} /> Guardado
                        </span>
                      )}
                    </div>
                    <button onClick={() => guardar(partido)}
                      disabled={saving === partido.id || !sc.local || !sc.visitante}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40',
                        partido.resultado_cargado
                          ? 'bg-white/10 text-white hover:bg-white/15'
                          : 'bg-gold-500 text-navy-900 hover:bg-gold-400'
                      )}>
                      <Save size={11} />
                      {partido.resultado_cargado ? 'Actualizar' : 'Guardar'}
                    </button>
                  </div>
                </div>
              )
            })}
            {fasesElim.length > 0 && partidosElim.length === 0 && (
              <p className="text-center text-white/30 text-sm py-8">No hay partidos en esta fase</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
