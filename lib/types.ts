// ── Tipos base ───────────────────────────────────────────────

export type Fase =
  | 'grupos'
  | '32avos'
  | '16avos'
  | 'cuartos'
  | 'semis'
  | '3er_4to'
  | 'final'

export type Grupo = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L'

// ── Tablas de base de datos ──────────────────────────────────

export interface Perfil {
  id: string
  nombre: string
  email: string
  is_admin: boolean
  pago: boolean
  monto_pagado: number
  fecha_pago: string | null
  created_at: string
}

export interface Partido {
  id: number
  match_number: number
  fase: Fase
  grupo: Grupo | null
  equipo_local: string
  equipo_visitante: string
  estadio: string | null
  ciudad: string | null
  kickoff_utc: string
  bloqueo_manual: string | null
  goles_local: number | null
  goles_visitante: number | null
  resultado_cargado: boolean
  ranking_fifa_local: number
  ranking_fifa_visitante: number
}

export interface Pronostico {
  id: string
  user_id: string
  partido_id: number
  goles_local: number
  goles_visitante: number
  created_at: string
  updated_at: string
}

export interface PronosticoCampeon {
  user_id: string
  equipo: string
  bloqueado: boolean
  created_at: string
}

export interface PronosticoGoleador {
  user_id: string
  jugador: string
  bloqueado: boolean
  created_at: string
}

export interface TorneoResultado {
  campeon_real: string | null
  goleador_real: string | null
  goleador_definido: boolean
  campeon_definido: boolean
}

export interface PozoConfig {
  monto_inscripcion: number
  premio_1: string
  premio_2: string
  premio_3: string
}

// ── Scoring ──────────────────────────────────────────────────

export interface PuntosPartido {
  partido_id: number
  ganador: boolean    // 1pt
  diferencia: boolean // +1pt
  exacto: boolean     // +1pt
  exacto_plus: boolean // +1pt (4+ goles)
  upset: boolean      // +1pt bonus
  total: number
}

export interface PuntosUsuario {
  user_id: string
  nombre: string
  pago: boolean
  // puntos acumulados
  total: number
  // desempate A: campeon
  acierto_campeon: boolean
  // desempate B
  exacto_plus_count: number
  // desempate C
  exacto_count: number
  // desempate D
  diferencia_count: number
  // desempate E
  ganador_count: number
  // extra
  upset_count: number
  goleador_ok: boolean
  // por fase
  puntos_grupos: number
  puntos_32avos: number
  puntos_16avos: number
  puntos_cuartos: number
  puntos_semis: number
  puntos_final: number
}

// ── UI State ─────────────────────────────────────────────────

export interface PartidoConEstado extends Partido {
  bloqueado: boolean         // calculado al momento de renderizar
  pronostico: Pronostico | null
  minutos_para_bloqueo: number | null // null si ya bloqueado
}

export const FASES_LABEL: Record<Fase, string> = {
  grupos:  'Fase de Grupos',
  '32avos': 'Ronda de 32',
  '16avos': 'Octavos de Final',
  cuartos: 'Cuartos de Final',
  semis:   'Semifinales',
  '3er_4to': '3° y 4° Puesto',
  final:   'Final',
}

export const FASES_ORDEN: Fase[] = [
  'grupos','32avos','16avos','cuartos','semis','3er_4to','final'
]

// Puntos extra por predecir campeón
export const CAMPEON_BONUS: Record<string, number> = {
  'Francia': 4, 'España': 4, 'Argentina': 4,
  'Brasil': 8, 'Inglaterra': 8, 'Portugal': 8, 'Alemania': 8,
  'Uruguay': 12, 'Colombia': 12, 'Bélgica': 12, 'Países Bajos': 12, 'Estados Unidos': 12,
}
export const CAMPEON_BONUS_DEFAULT = 24

export const UPSET_RANKING_DIFF = 300 // diferencia mínima en pts FIFA para bonus upset
