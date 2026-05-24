'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { esBloqueado, minutosParaBloqueo } from '@/lib/scoring'
import type { Partido, Pronostico, PronosticoCampeon, PronosticoGoleador, TorneoResultado } from '@/lib/types'
import { FASES_LABEL, FASES_ORDEN, CAMPEON_BONUS, CAMPEON_BONUS_DEFAULT } from '@/lib/types'
import { Lock, Clock, CheckCircle, ChevronRight, Star, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import clsx from 'clsx'

const EQUIPOS_2026 = [
  'Argentina','Francia','España','Brasil','Inglaterra','Portugal','Alemania',
  'Países Bajos','Bélgica','Uruguay','Marruecos','Japón','Estados Unidos','México',
  'Croacia','Colombia','Suiza','Ecuador','Australia','Noruega','Senegal',
  'Corea del Sur','Irán','Turquía','Suecia','Costa de Marfil','Ghana',
  'Arabia Saudita','Argelia','Austria','Egipto','Escocia','Sudáfrica',
  'Chequia','Bosnia y Herz.','RD Congo','Uzbekistán','Cabo Verde',
  'Túnez','Canadá','Paraguay','Iraq','Qatar','Jordania','Nueva Zelanda',
  'Haití','Curazao','Panamá',
]

interface Props {
  userId: string
  partidos: Partido[]
  pronosticosIniciales: Pronostico[]
  campeonInicial: PronosticoCampeon | null
  goleadorInicial: PronosticoGoleador | null
  torneoResultado: TorneoResultado
}

export default function PronosticosClient({
  userId, partidos, pronosticosIniciales,
  campeonInicial, goleadorInicial, torneoResultado
}: Props) {
  const supabase = createClient()
  const [selectedFase, setSelectedFase] = useState<string>('grupos')
  const [pronosticos, setPronosticos] = useState<Map<number, Pronostico>>(
    new Map(pronosticosIniciales.map(p => [p.partido_id, p]))
  )
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved] = useState<Set<number>>(new Set())
  const [errors, setErrors] = useState<Map<number, string>>(new Map())

  // Campeon y goleador
  const [campeon, setCampeon] = useState(campeonInicial?.equipo ?? '')
  const [goleador, setGoleador] = useState(goleadorInicial?.jugador ?? '')
  const [savingExtra, setSavingExtra] = useState(false)
  const [savedExtra, setSavedExtra] = useState(false)

  // Temporizador para actualizar estados de bloqueo
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 30000)
    return () => clearInterval(t)
  }, [])

  const fasesDisponibles = FASES_ORDEN.filter(f =>
    partidos.some(p => p.fase === f)
  )

  const partidosFase = partidos.filter(p => p.fase === selectedFase)
    .sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime())

  async function guardarPronostico(partido: Partido, local: number, visitante: number) {
    if (esBloqueado(partido)) return
    setSaving(partido.id)
    setErrors(prev => { const n = new Map(prev); n.delete(partido.id); return n })

    const pronostico = {
      user_id: userId,
      partido_id: partido.id,
      goles_local: local,
      goles_visitante: visitante,
    }

    const { error } = await supabase
      .from('pronosticos')
      .upsert(pronostico, { onConflict: 'user_id,partido_id' })

    if (error) {
      setErrors(prev => new Map(prev).set(partido.id, 'Error al guardar'))
    } else {
      setPronosticos(prev => {
        const n = new Map(prev)
        n.set(partido.id, { ...pronostico, id: '', created_at: '', updated_at: '' })
        return n
      })
      setSaved(prev => new Set(prev).add(partido.id))
      setTimeout(() => setSaved(prev => { const n = new Set(prev); n.delete(partido.id); return n }), 2000)
    }
    setSaving(null)
  }

  async function guardarCampeonGoleador() {
    setSavingExtra(true)
    const promises = []

    if (campeon && !torneoResultado.campeon_definido) {
      promises.push(
        supabase.from('pronostico_campeon')
          .upsert({ user_id: userId, equipo: campeon }, { onConflict: 'user_id' })
      )
    }
    if (goleador && !torneoResultado.goleador_definido) {
      promises.push(
        supabase.from('pronostico_goleador')
          .upsert({ user_id: userId, jugador: goleador }, { onConflict: 'user_id' })
      )
    }

    await Promise.all(promises)
    setSavingExtra(false)
    setSavedExtra(true)
    setTimeout(() => setSavedExtra(false), 2000)
  }

  const campeonBonusValue = campeon
    ? (CAMPEON_BONUS[campeon] ?? CAMPEON_BONUS_DEFAULT)
    : null

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl tracking-wider text-gold-400">MIS PRONÓSTICOS</h1>
        <p className="text-white/40 text-xs mt-0.5">
          Los partidos se bloquean 5 minutos antes del pitazo inicial
        </p>
      </div>

      {/* Campeon + Goleador — siempre visible */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Star size={14} className="text-gold-400" />
          <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            Apuestas especiales
          </span>
        </div>

        <div>
          <label className="label-text block mb-1.5">
            🏆 Campeón del mundo
            {campeonBonusValue && (
              <span className="ml-2 text-gold-400 normal-case">
                (+{campeonBonusValue} pts si acertás)
              </span>
            )}
          </label>
          {torneoResultado.campeon_definido ? (
            <div className="input-field opacity-50 flex items-center gap-2">
              <Lock size={12} className="text-white/40" />
              <span>{campeon || 'Sin pronóstico'}</span>
            </div>
          ) : (
            <select
              value={campeon}
              onChange={e => setCampeon(e.target.value)}
              className="input-field"
            >
              <option value="">Elegí un equipo...</option>
              {EQUIPOS_2026.map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="label-text block mb-1.5">
            ⚽ Goleador del torneo
            <span className="ml-2 text-gold-400 normal-case">(+5 pts si acertás)</span>
          </label>
          {torneoResultado.goleador_definido ? (
            <div className="input-field opacity-50 flex items-center gap-2">
              <Lock size={12} className="text-white/40" />
              <span>{goleador || 'Sin pronóstico'}</span>
            </div>
          ) : (
            <input
              type="text"
              value={goleador}
              onChange={e => setGoleador(e.target.value)}
              className="input-field"
              placeholder="Ej: Kylian Mbappé"
            />
          )}
        </div>

        {(!torneoResultado.campeon_definido || !torneoResultado.goleador_definido) && (
          <button
            onClick={guardarCampeonGoleador}
            disabled={savingExtra || (!campeon && !goleador)}
            className="btn-primary w-full disabled:opacity-50"
          >
            {savedExtra ? '✓ Guardado' : savingExtra ? 'Guardando...' : 'Guardar apuestas especiales'}
          </button>
        )}
      </div>

      {/* Selector de fase */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {fasesDisponibles.map(fase => (
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
          </button>
        ))}
      </div>

      {/* Partidos de la fase */}
      <div className="space-y-3">
        {partidosFase.map(partido => (
          <PartidoCard
            key={partido.id}
            partido={partido}
            pronostico={pronosticos.get(partido.id) ?? null}
            saving={saving === partido.id}
            saved={saved.has(partido.id)}
            error={errors.get(partido.id)}
            onSave={guardarPronostico}
          />
        ))}

        {partidosFase.length === 0 && (
          <div className="card py-12 text-center text-white/30 text-sm">
            No hay partidos en esta fase todavía
          </div>
        )}
      </div>
    </div>
  )
}

// ── Componente de cada partido ────────────────────────────────

function PartidoCard({
  partido, pronostico, saving, saved, error, onSave
}: {
  partido: Partido
  pronostico: Pronostico | null
  saving: boolean
  saved: boolean
  error: string | undefined
  onSave: (partido: Partido, local: number, visitante: number) => void
}) {
  const bloqueado = esBloqueado(partido)
  const minutos = minutosParaBloqueo(partido)
  const [local, setLocal] = useState(pronostico?.goles_local ?? '')
  const [visitante, setVisitante] = useState(pronostico?.goles_visitante ?? '')
  const kickoff = new Date(partido.kickoff_utc)

  // Advertencia de cierre próximo
  const proximoACerrar = !bloqueado && minutos !== null && minutos <= 60

  function handleSave() {
    const l = parseInt(String(local))
    const v = parseInt(String(visitante))
    if (isNaN(l) || isNaN(v) || l < 0 || v < 0) return
    onSave(partido, l, v)
  }

  const isEdited = String(local) !== String(pronostico?.goles_local ?? '')
             || String(visitante) !== String(pronostico?.goles_visitante ?? '')

  const rankingDiff = Math.abs(partido.ranking_fifa_local - partido.ranking_fifa_visitante)
  const hasUpsetBonus = rankingDiff >= 300

  return (
    <div className={clsx(
      'card p-4 transition-all',
      bloqueado && 'opacity-70',
      proximoACerrar && !bloqueado && 'border-orange-400/30'
    )}>
      {/* Meta info del partido */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {partido.grupo && (
            <span className="text-[10px] font-bold text-gold-500/70 bg-gold-500/10 
                             px-1.5 py-0.5 rounded">
              GRP {partido.grupo}
            </span>
          )}
          <span className="text-white/30 text-[10px]">
            {format(kickoff, "d MMM · HH:mm", { locale: es })} UTC
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {hasUpsetBonus && (
            <span className="flex items-center gap-0.5 text-[10px] text-orange-400/70">
              <Zap size={9} />
              upset
            </span>
          )}
          {bloqueado ? (
            <span className="flex items-center gap-1 text-[10px] text-red-400/70">
              <Lock size={9} />
              Cerrado
            </span>
          ) : proximoACerrar ? (
            <span className="flex items-center gap-1 text-[10px] text-orange-400 pulse-lock px-1.5 py-0.5 rounded">
              <Clock size={9} />
              {minutos! < 60 ? `${minutos}min` : `${Math.round(minutos!/60)}h`}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-green-400/60">
              <Clock size={9} />
              Abierto
            </span>
          )}
        </div>
      </div>

      {/* Equipos y pronóstico */}
      <div className="flex items-center gap-3">
        <div className="flex-1 text-right">
          <p className="text-white font-semibold text-sm leading-tight">
            {partido.equipo_local}
          </p>
          <p className="text-white/30 text-[10px]">Local</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {bloqueado ? (
            <>
              <div className="score-input opacity-50 flex items-center justify-center">
                {pronostico?.goles_local ?? '-'}
              </div>
              <span className="text-white/30 text-sm">—</span>
              <div className="score-input opacity-50 flex items-center justify-center">
                {pronostico?.goles_visitante ?? '-'}
              </div>
            </>
          ) : (
            <>
              <input
                type="number"
                min={0} max={20}
                value={local}
                onChange={e => setLocal(e.target.value)}
                className="score-input"
                onBlur={() => {
                  const l = parseInt(String(local))
                  const v = parseInt(String(visitante))
                  if (!isNaN(l) && !isNaN(v)) handleSave()
                }}
              />
              <span className="text-white/30 text-sm">—</span>
              <input
                type="number"
                min={0} max={20}
                value={visitante}
                onChange={e => setVisitante(e.target.value)}
                className="score-input"
                onBlur={() => {
                  const l = parseInt(String(local))
                  const v = parseInt(String(visitante))
                  if (!isNaN(l) && !isNaN(v)) handleSave()
                }}
              />
            </>
          )}
        </div>

        <div className="flex-1">
          <p className="text-white font-semibold text-sm leading-tight">
            {partido.equipo_visitante}
          </p>
          <p className="text-white/30 text-[10px]">Visitante</p>
        </div>
      </div>

      {/* Resultado real (si existe) */}
      {partido.resultado_cargado && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-white/30 text-[10px]">Resultado final</span>
          <span className="text-white font-bold text-sm">
            {partido.goles_local} — {partido.goles_visitante}
          </span>
        </div>
      )}

      {/* Estado */}
      <div className="mt-2 flex items-center justify-between h-4">
        <span className="text-white/20 text-[10px]">{partido.estadio}</span>
        {saving && <span className="text-white/40 text-[10px]">Guardando...</span>}
        {saved && !saving && (
          <span className="text-green-400 text-[10px] flex items-center gap-1">
            <CheckCircle size={9} />
            Guardado
          </span>
        )}
        {error && <span className="text-red-400 text-[10px]">{error}</span>}
      </div>
    </div>
  )
}
