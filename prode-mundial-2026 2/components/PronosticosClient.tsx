'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { esBloqueado, minutosParaBloqueo } from '@/lib/scoring'
import type { Partido, Pronostico, PronosticoCampeon, PronosticoGoleador, TorneoResultado } from '@/lib/types'
import { FASES_LABEL, FASES_ORDEN, CAMPEON_BONUS, CAMPEON_BONUS_DEFAULT } from '@/lib/types'
import { bandera, TOP_JUGADORES, BANDERAS } from '@/lib/flags'
import { Lock, Clock, CheckCircle, Star, Zap, Save } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import clsx from 'clsx'

const EQUIPOS_2026 = Object.keys(BANDERAS).sort()

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

  // Campeón y goleador — persisten al valor guardado
  const [campeon, setCampeon] = useState(campeonInicial?.equipo ?? '')
  const [goleador, setGoleador] = useState(goleadorInicial?.jugador ?? '')
  const [campeonGuardado, setCampeonGuardado] = useState(campeonInicial?.equipo ?? '')
  const [goleadorGuardado, setGoleadorGuardado] = useState(goleadorInicial?.jugador ?? '')
  const [savingExtra, setSavingExtra] = useState(false)
  const [savedExtra, setSavedExtra] = useState(false)

  // Tick para actualizar estados de bloqueo
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 30000)
    return () => clearInterval(t)
  }, [])

  const fasesDisponibles = FASES_ORDEN.filter(f => partidos.some(p => p.fase === f))
  const partidosFase = partidos
    .filter(p => p.fase === selectedFase)
    .sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime())

  // Estadísticas rápidas de completitud
  const totalGrupos = partidos.filter(p => p.fase === 'grupos').length
  const completadosGrupos = partidos.filter(p => p.fase === 'grupos' && pronosticos.has(p.id)).length

  async function guardarPronostico(partido: Partido, local: number, visitante: number) {
    if (esBloqueado(partido)) return
    setSaving(partido.id)
    setErrors(prev => { const n = new Map(prev); n.delete(partido.id); return n })

    const data = { user_id: userId, partido_id: partido.id, goles_local: local, goles_visitante: visitante }
    const { error } = await supabase.from('pronosticos')
      .upsert(data, { onConflict: 'user_id,partido_id' })

    if (error) {
      setErrors(prev => new Map(prev).set(partido.id, 'Error al guardar'))
    } else {
      setPronosticos(prev => {
        const n = new Map(prev)
        n.set(partido.id, { ...data, id: '', created_at: '', updated_at: '' })
        return n
      })
      setSaved(prev => new Set(prev).add(partido.id))
      setTimeout(() => setSaved(prev => { const n = new Set(prev); n.delete(partido.id); return n }), 2500)
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
    setCampeonGuardado(campeon)
    setGoleadorGuardado(goleador)
    setSavingExtra(false)
    setSavedExtra(true)
    setTimeout(() => setSavedExtra(false), 3000)
  }

  const campeonBonusValue = campeon ? (CAMPEON_BONUS[campeon] ?? CAMPEON_BONUS_DEFAULT) : null
  const hayPendientes = (campeon && campeon !== campeonGuardado) || (goleador && goleador !== goleadorGuardado)

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wider text-gold-400">MIS PRONÓSTICOS</h1>
          <p className="text-white/40 text-xs mt-0.5">
            {completadosGrupos}/{totalGrupos} partidos de grupos completados
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{completadosGrupos}</div>
          <div className="text-white/30 text-[10px]">cargados</div>
        </div>
      </div>

      {/* ── APUESTAS ESPECIALES ── */}
      <div className="card p-4 space-y-4 border border-gold-500/15">
        <div className="flex items-center gap-2">
          <Star size={14} className="text-gold-400" />
          <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">
            Apuestas especiales — se bloquean el 11 Jun
          </span>
        </div>

        {/* Campeón */}
        <div>
          <label className="label-text block mb-1.5">
            🏆 Campeón del mundo
            {campeonBonusValue && (
              <span className="ml-2 text-gold-400 normal-case font-normal">
                +{campeonBonusValue} pts si acertás
              </span>
            )}
          </label>
          {torneoResultado.campeon_definido ? (
            <div className="input-field opacity-60 flex items-center gap-2">
              <Lock size={12} className="text-white/40" />
              <span>{campeonGuardado ? `${bandera(campeonGuardado)} ${campeonGuardado}` : 'Sin pronóstico'}</span>
            </div>
          ) : (
            <select
              value={campeon}
              onChange={e => setCampeon(e.target.value)}
              className="input-field"
            >
              <option value="">Elegí un equipo...</option>
              {EQUIPOS_2026.map(eq => (
                <option key={eq} value={eq}>{bandera(eq)} {eq}</option>
              ))}
            </select>
          )}
          {/* Muestra lo guardado */}
          {campeonGuardado && !torneoResultado.campeon_definido && (
            <p className="text-white/30 text-[10px] mt-1.5 flex items-center gap-1">
              <CheckCircle size={9} className="text-green-400" />
              Guardado: {bandera(campeonGuardado)} {campeonGuardado}
              {campeon !== campeonGuardado && campeon && (
                <span className="text-orange-400 ml-1">(sin guardar: {campeon})</span>
              )}
            </p>
          )}
        </div>

        {/* Goleador */}
        <div>
          <label className="label-text block mb-1.5">
            ⚽ Goleador del torneo
            <span className="ml-2 text-gold-400 normal-case font-normal">+5 pts si acertás</span>
          </label>
          {torneoResultado.goleador_definido ? (
            <div className="input-field opacity-60 flex items-center gap-2">
              <Lock size={12} className="text-white/40" />
              <span>{goleadorGuardado || 'Sin pronóstico'}</span>
            </div>
          ) : (
            <>
              <select
                value={goleador}
                onChange={e => setGoleador(e.target.value)}
                className="input-field"
              >
                <option value="">Elegí un jugador...</option>
                {TOP_JUGADORES.map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
                <option value="__otro__" disabled>── Otro (escribí abajo) ──</option>
              </select>
              {/* Input manual por si no está en la lista */}
              <input
                type="text"
                value={goleador === '__otro__' ? '' : (TOP_JUGADORES.includes(goleador) ? '' : goleador)}
                onChange={e => setGoleador(e.target.value)}
                className="input-field mt-2"
                placeholder="O escribí el nombre exacto del jugador..."
              />
            </>
          )}
          {/* Muestra lo guardado */}
          {goleadorGuardado && !torneoResultado.goleador_definido && (
            <p className="text-white/30 text-[10px] mt-1.5 flex items-center gap-1">
              <CheckCircle size={9} className="text-green-400" />
              Guardado: {goleadorGuardado}
              {goleador !== goleadorGuardado && goleador && !['', '__otro__'].includes(goleador) && (
                <span className="text-orange-400 ml-1">(sin guardar: {goleador})</span>
              )}
            </p>
          )}
        </div>

        {/* Botón guardar explícito */}
        {(!torneoResultado.campeon_definido || !torneoResultado.goleador_definido) && (
          <button
            onClick={guardarCampeonGoleador}
            disabled={savingExtra || (!campeon && !goleador) || goleador === '__otro__'}
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
              'font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed',
              savedExtra
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : hayPendientes
                  ? 'bg-gold-500 text-navy-900 hover:bg-gold-400'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            )}
          >
            {savedExtra ? (
              <><CheckCircle size={15} /> ¡Guardado correctamente!</>
            ) : savingExtra ? (
              'Guardando...'
            ) : (
              <><Save size={15} /> {hayPendientes ? 'Guardar cambios' : 'Guardar apuestas'}</>
            )}
          </button>
        )}
      </div>

      {/* ── SELECTOR DE FASE ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {fasesDisponibles.map(fase => {
          const total = partidos.filter(p => p.fase === fase).length
          const completados = partidos.filter(p => p.fase === fase && pronosticos.has(p.id)).length
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
              {total > 0 && (
                <span className="ml-1.5 opacity-60">{completados}/{total}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── PARTIDOS ── */}
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

// ── Tarjeta de partido individual ────────────────────────────

function PartidoCard({ partido, pronostico, saving, saved, error, onSave }: {
  partido: Partido
  pronostico: Pronostico | null
  saving: boolean; saved: boolean
  error: string | undefined
  onSave: (partido: Partido, local: number, visitante: number) => void
}) {
  const bloqueado = esBloqueado(partido)
  const minutos = minutosParaBloqueo(partido)
  const [local, setLocal] = useState<string>(pronostico?.goles_local?.toString() ?? '')
  const [visitante, setVisitante] = useState<string>(pronostico?.goles_visitante?.toString() ?? '')
  const proximoACerrar = !bloqueado && minutos !== null && minutos <= 60

  // Actualizar si llega pronostico nuevo desde afuera
  useEffect(() => {
    if (pronostico) {
      setLocal(pronostico.goles_local.toString())
      setVisitante(pronostico.goles_visitante.toString())
    }
  }, [pronostico?.partido_id])

  function handleBlur() {
    const l = parseInt(local); const v = parseInt(visitante)
    if (!isNaN(l) && !isNaN(v) && l >= 0 && v >= 0 && !bloqueado) onSave(partido, l, v)
  }

  const rankingDiff = Math.abs(partido.ranking_fifa_local - partido.ranking_fifa_visitante)
  const flagLocal = bandera(partido.equipo_local)
  const flagVisitante = bandera(partido.equipo_visitante)

  return (
    <div className={clsx(
      'card p-4 transition-all',
      bloqueado && 'opacity-70',
      proximoACerrar && !bloqueado && 'border-orange-400/30',
      saved && 'border-green-500/30'
    )}>
      {/* Meta */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {partido.grupo && (
            <span className="text-[10px] font-bold text-gold-500/70 bg-gold-500/10 px-1.5 py-0.5 rounded">
              GRP {partido.grupo}
            </span>
          )}
          <span className="text-white/30 text-[10px]">
            {format(new Date(partido.kickoff_utc), "d MMM · HH:mm", { locale: es })} UTC
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {rankingDiff >= 300 && (
            <span className="flex items-center gap-0.5 text-[10px] text-orange-400/70">
              <Zap size={9} /> upset
            </span>
          )}
          {bloqueado ? (
            <span className="flex items-center gap-1 text-[10px] text-red-400/70">
              <Lock size={9} /> Cerrado
            </span>
          ) : proximoACerrar ? (
            <span className="flex items-center gap-1 text-[10px] text-orange-400 px-1.5 py-0.5 rounded">
              <Clock size={9} /> {minutos! < 60 ? `${minutos}min` : `${Math.round(minutos!/60)}h`}
            </span>
          ) : (
            <span className="text-[10px] text-green-400/50">Abierto</span>
          )}
        </div>
      </div>

      {/* Equipos + score */}
      <div className="flex items-center gap-2">
        {/* Local */}
        <div className="flex-1 text-right">
          <p className="text-white font-semibold text-sm leading-tight">
            {flagLocal} {partido.equipo_local}
          </p>
          <p className="text-white/25 text-[10px]">Local</p>
        </div>

        {/* Inputs */}
        <div className="flex items-center gap-1.5 shrink-0">
          {bloqueado ? (
            <>
              <div className="score-input opacity-50 flex items-center justify-center text-sm font-bold">
                {pronostico?.goles_local ?? '—'}
              </div>
              <span className="text-white/20 text-xs">—</span>
              <div className="score-input opacity-50 flex items-center justify-center text-sm font-bold">
                {pronostico?.goles_visitante ?? '—'}
              </div>
            </>
          ) : (
            <>
              <input
                type="number" min={0} max={20}
                value={local}
                onChange={e => setLocal(e.target.value)}
                onBlur={handleBlur}
                className="score-input"
              />
              <span className="text-white/20 text-xs">—</span>
              <input
                type="number" min={0} max={20}
                value={visitante}
                onChange={e => setVisitante(e.target.value)}
                onBlur={handleBlur}
                className="score-input"
              />
            </>
          )}
        </div>

        {/* Visitante */}
        <div className="flex-1">
          <p className="text-white font-semibold text-sm leading-tight">
            {partido.equipo_visitante} {flagVisitante}
          </p>
          <p className="text-white/25 text-[10px]">Visitante</p>
        </div>
      </div>

      {/* Resultado real */}
      {partido.resultado_cargado && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-white/30 text-[10px]">Resultado final</span>
          <span className="text-white font-bold text-sm">
            {partido.goles_local} — {partido.goles_visitante}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between h-4">
        <span className="text-white/15 text-[10px] truncate">{partido.estadio}</span>
        <div>
          {saving && <span className="text-white/30 text-[10px]">Guardando...</span>}
          {saved && !saving && (
            <span className="text-green-400 text-[10px] flex items-center gap-1">
              <CheckCircle size={9} /> Guardado
            </span>
          )}
          {error && <span className="text-red-400 text-[10px]">{error}</span>}
        </div>
      </div>
    </div>
  )
}
