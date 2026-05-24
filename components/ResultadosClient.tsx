'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Partido } from '@/lib/types'
import { FASES_LABEL, FASES_ORDEN } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle, Lock, ChevronLeft } from 'lucide-react'
import clsx from 'clsx'
import Link from 'next/link'

export default function ResultadosClient({ partidos }: { partidos: Partido[] }) {
  const supabase = createClient()
  const [selectedFase, setSelectedFase] = useState('grupos')
  const [localScores, setLocalScores] = useState<Map<number, { local: string; visitante: string }>>(
    new Map(partidos.map(p => [
      p.id,
      {
        local: p.goles_local !== null ? String(p.goles_local) : '',
        visitante: p.goles_visitante !== null ? String(p.goles_visitante) : '',
      }
    ]))
  )
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved] = useState<Set<number>>(new Set())
  const [errors, setErrors] = useState<Map<number, string>>(new Map())
  const [bloqueoPhase, setBloqueoPhase] = useState('')

  const fasesDisponibles = FASES_ORDEN.filter(f => partidos.some(p => p.fase === f))
  const partidosFase = partidos
    .filter(p => p.fase === selectedFase)
    .sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime())

  function updateScore(id: number, field: 'local' | 'visitante', value: string) {
    setLocalScores(prev => {
      const n = new Map(prev)
      const curr = n.get(id) ?? { local: '', visitante: '' }
      n.set(id, { ...curr, [field]: value })
      return n
    })
  }

  async function guardarResultado(partido: Partido) {
    const scores = localScores.get(partido.id)
    if (!scores) return
    const l = parseInt(scores.local)
    const v = parseInt(scores.visitante)
    if (isNaN(l) || isNaN(v) || l < 0 || v < 0) {
      setErrors(prev => new Map(prev).set(partido.id, 'Ingresá valores válidos (0 o más)'))
      return
    }

    setSaving(partido.id)
    setErrors(prev => { const n = new Map(prev); n.delete(partido.id); return n })

    const { error } = await supabase.from('partidos').update({
      goles_local: l,
      goles_visitante: v,
      resultado_cargado: true,
    }).eq('id', partido.id)

    if (error) {
      setErrors(prev => new Map(prev).set(partido.id, 'Error al guardar'))
    } else {
      setSaved(prev => new Set(prev).add(partido.id))
      setTimeout(() => setSaved(prev => { const n = new Set(prev); n.delete(partido.id); return n }), 3000)
    }
    setSaving(null)
  }

  async function limpiarResultado(partido: Partido) {
    if (!confirm(`¿Limpiar resultado de ${partido.equipo_local} vs ${partido.equipo_visitante}?`)) return
    await supabase.from('partidos').update({
      goles_local: null,
      goles_visitante: null,
      resultado_cargado: false,
    }).eq('id', partido.id)
    setLocalScores(prev => {
      const n = new Map(prev)
      n.set(partido.id, { local: '', visitante: '' })
      return n
    })
  }

  async function bloquearFase() {
    const ahora = new Date().toISOString()
    const { error } = await supabase.from('partidos')
      .update({ bloqueo_manual: ahora })
      .eq('fase', selectedFase)
      .is('bloqueo_manual', null)

    if (!error) {
      alert(`✓ Fase "${FASES_LABEL[selectedFase as keyof typeof FASES_LABEL]}" bloqueada exitosamente`)
    }
  }

  async function actualizarEquiposPartido(id: number, local: string, visitante: string) {
    await supabase.from('partidos').update({
      equipo_local: local,
      equipo_visitante: visitante,
    }).eq('id', id)
    alert('Equipos actualizados')
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-white/40 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-3xl tracking-wider text-gold-400">RESULTADOS</h1>
          <p className="text-white/40 text-xs">Cargar y editar resultados de partidos</p>
        </div>
      </div>

      {/* Selector de fase */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {fasesDisponibles.map(fase => {
          const cargados = partidos.filter(p => p.fase === fase && p.resultado_cargado).length
          const total = partidos.filter(p => p.fase === fase).length
          return (
            <button
              key={fase}
              onClick={() => setSelectedFase(fase)}
              className={clsx(
                'shrink-0 px-3 py-2 rounded-full text-xs font-semibold transition-all',
                selectedFase === fase
                  ? 'bg-gold-500 text-navy-900'
                  : 'border border-white/15 text-white/50 hover:text-white/70'
              )}
            >
              {FASES_LABEL[fase as keyof typeof FASES_LABEL]}
              <span className="ml-1 opacity-60">{cargados}/{total}</span>
            </button>
          )
        })}
      </div>

      {/* Botón bloquear fase eliminatoria */}
      {selectedFase !== 'grupos' && (
        <button
          onClick={bloquearFase}
          className="btn-danger w-full flex items-center justify-center gap-2"
        >
          <Lock size={14} />
          Bloquear pronósticos de {FASES_LABEL[selectedFase as keyof typeof FASES_LABEL]}
        </button>
      )}

      {/* Partidos */}
      <div className="space-y-3">
        {partidosFase.map(partido => {
          const scores = localScores.get(partido.id) ?? { local: '', visitante: '' }
          const kickoff = new Date(partido.kickoff_utc)

          return (
            <div key={partido.id} className="card p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  {partido.grupo && (
                    <span className="text-[10px] font-bold text-gold-500/70 bg-gold-500/10 px-1.5 py-0.5 rounded mr-1.5">
                      G{partido.grupo}
                    </span>
                  )}
                  <span className="text-white/30 text-[10px]">
                    #{partido.match_number} · {format(kickoff, "d MMM HH:mm", { locale: es })} UTC
                  </span>
                </div>
                {partido.resultado_cargado && (
                  <button
                    onClick={() => limpiarResultado(partido)}
                    className="text-red-400/60 text-[10px] hover:text-red-400 transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Equipos con score inputs */}
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{partido.equipo_local}</p>
                  <p className="text-white/30 text-[10px]">Local</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number" min={0} max={20}
                    value={scores.local}
                    onChange={e => updateScore(partido.id, 'local', e.target.value)}
                    className="score-input"
                    placeholder="—"
                  />
                  <span className="text-white/30">—</span>
                  <input
                    type="number" min={0} max={20}
                    value={scores.visitante}
                    onChange={e => updateScore(partido.id, 'visitante', e.target.value)}
                    className="score-input"
                    placeholder="—"
                  />
                </div>

                <div className="flex-1 min-w-0 text-right">
                  <p className="text-white text-sm font-medium truncate">{partido.equipo_visitante}</p>
                  <p className="text-white/30 text-[10px]">Visitante</p>
                </div>
              </div>

              {/* Status y botón */}
              <div className="flex items-center justify-between">
                <div className="h-5">
                  {errors.get(partido.id) && (
                    <span className="text-red-400 text-[10px]">{errors.get(partido.id)}</span>
                  )}
                  {saved.has(partido.id) && (
                    <span className="text-green-400 text-[10px] flex items-center gap-1">
                      <CheckCircle size={10} />
                      Guardado
                    </span>
                  )}
                </div>

                <button
                  onClick={() => guardarResultado(partido)}
                  disabled={saving === partido.id || !scores.local || !scores.visitante}
                  className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50"
                >
                  {saving === partido.id ? 'Guardando...' : partido.resultado_cargado ? 'Actualizar' : 'Cargar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
