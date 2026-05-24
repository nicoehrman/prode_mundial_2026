/**
 * Motor de puntaje — Prode Mundial 2026
 *
 * Reglas:
 *  1pt  — Adivinar ganador o empate (L/E/V)
 * +1pt  — Diferencia de goles exacta (solo si hay ganador, no en empate)
 * +1pt  — Resultado exacto
 * +1pt  — Resultado exacto con más de 4 goles (5+ goles en total)
 * +1pt  — Bonus upset: equipo con ranking inferior gana y fue pronosticado
 *  5pt  — Goleador del torneo acertado
 *  4-24pt — Bonus campeón según favorito
 *
 * Para eliminatorias: el resultado válido es hasta el alargue (120').
 * Si el partido termina en penales, el resultado del alargue es el válido.
 * Si termina 2-2 en el alargue (y van a penales), el resultado es 2-2 (empate).
 */

import type {
  Partido, Pronostico, PuntosPartido, PuntosUsuario,
  TorneoResultado, PronosticoCampeon, PronosticoGoleador
} from './types'
import { CAMPEON_BONUS, CAMPEON_BONUS_DEFAULT, UPSET_RANKING_DIFF } from './types'

// ── Puntos de un pronostico para un partido específico ───────

export function calcularPuntosPartido(
  partido: Partido,
  pronostico: Pronostico | null | undefined
): PuntosPartido {
  const vacio: PuntosPartido = {
    partido_id: partido.id,
    ganador: false, diferencia: false,
    exacto: false, exacto_plus: false, upset: false,
    total: 0
  }

  // Sin pronóstico o sin resultado: 0 puntos
  if (!pronostico || !partido.resultado_cargado) return vacio
  if (partido.goles_local === null || partido.goles_visitante === null) return vacio

  const pGL = pronostico.goles_local
  const pGV = pronostico.goles_visitante
  const rGL = partido.goles_local
  const rGV = partido.goles_visitante

  // Determinar L/E/V del resultado real
  const realSigno = Math.sign(rGL - rGV)
  const predSigno = Math.sign(pGL - pGV)

  const result: PuntosPartido = { ...vacio }

  // 1pt: ganador o empate correcto
  if (predSigno === realSigno) {
    result.ganador = true
    result.total += 1

    // +1pt: diferencia de goles (solo si hay ganador, no empate)
    if (realSigno !== 0) {
      const realDiff = Math.abs(rGL - rGV)
      const predDiff = Math.abs(pGL - pGV)
      if (realDiff === predDiff) {
        result.diferencia = true
        result.total += 1
      }
    }

    // +1pt: resultado exacto
    if (pGL === rGL && pGV === rGV) {
      result.exacto = true
      result.total += 1

      // +1pt: resultado exacto con MÁS de 4 goles (5+)
      if ((rGL + rGV) > 4) {
        result.exacto_plus = true
        result.total += 1
      }
    }

    // Bonus upset: pronosticó correctamente al perdedor favorito
    const rankingDiff = Math.abs(partido.ranking_fifa_local - partido.ranking_fifa_visitante)
    if (rankingDiff >= UPSET_RANKING_DIFF && realSigno !== 0) {
      // ¿ganó el equipo de menor ranking (underdog)?
      const underdogEsLocal = partido.ranking_fifa_local < partido.ranking_fifa_visitante
      const underdogGano = (underdogEsLocal && realSigno === 1) || (!underdogEsLocal && realSigno === -1)
      const predUnderdogGano = (underdogEsLocal && predSigno === 1) || (!underdogEsLocal && predSigno === -1)

      if (underdogGano && predUnderdogGano) {
        result.upset = true
        result.total += 1
      }
    }
  }

  return result
}

// ── Calcular tabla general de todos los participantes ────────

export interface DatosScoring {
  partidos: Partido[]
  pronosticos: Pronostico[]               // todos los pronosticos de todos los users
  perfiles: Array<{ id: string; nombre: string; pago: boolean }>
  pronosticosCampeon: PronosticoCampeon[]
  pronosticosGoleador: PronosticoGoleador[]
  torneoResultado: TorneoResultado
}

export function calcularTabla(datos: DatosScoring): PuntosUsuario[] {
  const { partidos, pronosticos, perfiles, pronosticosCampeon,
          pronosticosGoleador, torneoResultado } = datos

  // Índice pronostico por user_id → partido_id → pronostico
  const pronosticoIdx = new Map<string, Map<number, Pronostico>>()
  for (const p of pronosticos) {
    if (!pronosticoIdx.has(p.user_id)) pronosticoIdx.set(p.user_id, new Map())
    pronosticoIdx.get(p.user_id)!.set(p.partido_id, p)
  }

  const campeonIdx = new Map(pronosticosCampeon.map(p => [p.user_id, p]))
  const goleadorIdx = new Map(pronosticosGoleador.map(p => [p.user_id, p]))

  const tabla: PuntosUsuario[] = []

  for (const perfil of perfiles) {
    const misPronosticos = pronosticoIdx.get(perfil.id) ?? new Map()

    const fila: PuntosUsuario = {
      user_id: perfil.id,
      nombre: perfil.nombre,
      pago: perfil.pago,
      total: 0,
      acierto_campeon: false,
      exacto_plus_count: 0,
      exacto_count: 0,
      diferencia_count: 0,
      ganador_count: 0,
      upset_count: 0,
      goleador_ok: false,
      puntos_grupos: 0,
      puntos_32avos: 0,
      puntos_16avos: 0,
      puntos_cuartos: 0,
      puntos_semis: 0,
      puntos_final: 0,
    }

    // Sumar puntos de partidos
    for (const partido of partidos) {
      if (!partido.resultado_cargado) continue
      const pronos = misPronosticos.get(partido.id)
      const pts = calcularPuntosPartido(partido, pronos)

      fila.total += pts.total
      if (pts.ganador) fila.ganador_count++
      if (pts.diferencia) fila.diferencia_count++
      if (pts.exacto) fila.exacto_count++
      if (pts.exacto_plus) fila.exacto_plus_count++
      if (pts.upset) fila.upset_count++

      // Por fase
      switch (partido.fase) {
        case 'grupos':  fila.puntos_grupos += pts.total; break
        case '32avos':  fila.puntos_32avos += pts.total; break
        case '16avos':  fila.puntos_16avos += pts.total; break
        case 'cuartos': fila.puntos_cuartos += pts.total; break
        case 'semis':   fila.puntos_semis += pts.total; break
        case 'final':   fila.puntos_final += pts.total; break
      }
    }

    // Bonus campeón
    const campeonPred = campeonIdx.get(perfil.id)
    if (campeonPred && torneoResultado.campeon_real) {
      if (campeonPred.equipo === torneoResultado.campeon_real) {
        fila.acierto_campeon = true
        const bonus = CAMPEON_BONUS[torneoResultado.campeon_real] ?? CAMPEON_BONUS_DEFAULT
        fila.total += bonus
      }
    }

    // Bonus goleador
    const goleadorPred = goleadorIdx.get(perfil.id)
    if (goleadorPred && torneoResultado.goleador_real && torneoResultado.goleador_definido) {
      if (goleadorPred.jugador.toLowerCase() === torneoResultado.goleador_real.toLowerCase()) {
        fila.goleador_ok = true
        fila.total += 5
      }
    }

    tabla.push(fila)
  }

  // Ordenar con desempate completo
  return tabla.sort(compararPorDesempate)
}

// ── Comparador de desempate (reglamento punto 3-E) ───────────

function compararPorDesempate(a: PuntosUsuario, b: PuntosUsuario): number {
  // Primero: puntos totales
  if (b.total !== a.total) return b.total - a.total
  // A: acierto de campeón
  if (b.acierto_campeon !== a.acierto_campeon) return b.acierto_campeon ? 1 : -1
  // B: más exactos con 4+ goles
  if (b.exacto_plus_count !== a.exacto_plus_count) return b.exacto_plus_count - a.exacto_plus_count
  // C: más exactos
  if (b.exacto_count !== a.exacto_count) return b.exacto_count - a.exacto_count
  // D: más diferencia exacta
  if (b.diferencia_count !== a.diferencia_count) return b.diferencia_count - a.diferencia_count
  // E: más ganadores/empates
  if (b.ganador_count !== a.ganador_count) return b.ganador_count - a.ganador_count
  // alfabético como último recurso
  return a.nombre.localeCompare(b.nombre)
}

// ── Helpers de UI ────────────────────────────────────────────

/** Retorna si un partido está bloqueado en este momento */
export function esBloqueado(partido: Partido): boolean {
  const ahora = Date.now()
  if (partido.bloqueo_manual) {
    return ahora >= new Date(partido.bloqueo_manual).getTime()
  }
  if (partido.fase === 'grupos') {
    const kickoff = new Date(partido.kickoff_utc).getTime()
    return ahora >= kickoff - 5 * 60 * 1000
  }
  return false
}

/** Minutos restantes para el bloqueo (null si ya bloqueado) */
export function minutosParaBloqueo(partido: Partido): number | null {
  const bloqueado = esBloqueado(partido)
  if (bloqueado) return null

  let bloqueoTs: number
  if (partido.bloqueo_manual) {
    bloqueoTs = new Date(partido.bloqueo_manual).getTime()
  } else {
    const kickoff = new Date(partido.kickoff_utc).getTime()
    bloqueoTs = kickoff - 5 * 60 * 1000
  }
  return Math.ceil((bloqueoTs - Date.now()) / 60000)
}

export function resultadoStr(partido: Partido): string {
  if (!partido.resultado_cargado) return 'Pendiente'
  return `${partido.goles_local} - ${partido.goles_visitante}`
}

export function pronosticoStr(p: Pronostico | null | undefined): string {
  if (!p) return '-'
  return `${p.goles_local} - ${p.goles_visitante}`
}
