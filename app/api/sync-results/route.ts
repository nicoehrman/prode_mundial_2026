import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Sincronización de resultados desde football-data.org
 * 
 * Esta ruta se llama manualmente desde el panel admin.
 * football-data.org Free Tier: 10 req/min, incluye competiciones principales.
 * Competition ID para FIFA World Cup 2026: verificar en https://www.football-data.org/competitions
 * 
 * Headers del response de football-data.org:
 * data.matches[].score.fullTime.home / away  →  resultado del partido
 * data.matches[].status: FINISHED / IN_PLAY / TIMED / SCHEDULED
 */

const FOOTBALL_DATA_API = 'https://api.football-data.org/v4'
// Verificar el ID correcto en https://api.football-data.org/v4/competitions
const WORLD_CUP_2026_ID = 'WC'

export async function POST() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
  }

  const supabase = createServiceClient()

  try {
    // Obtener partidos del Mundial 2026 desde la API
    const response = await fetch(
      `${FOOTBALL_DATA_API}/competitions/${WORLD_CUP_2026_ID}/matches?status=FINISHED`,
      {
        headers: {
          'X-Auth-Token': apiKey,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json(
        { error: `API error ${response.status}: ${text}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const matches = data.matches ?? []

    if (matches.length === 0) {
      return NextResponse.json({ message: 'No hay partidos finalizados todavía', updated: 0 })
    }

    // Obtener nuestros partidos de la DB
    const { data: partidos } = await supabase
      .from('partidos')
      .select('id, equipo_local, equipo_visitante, match_number, kickoff_utc')

    let updated = 0
    const errores: string[] = []

    for (const match of matches) {
      if (match.status !== 'FINISHED') continue

      const scoreHome = match.score?.fullTime?.home
      const scoreAway = match.score?.fullTime?.away

      if (scoreHome === null || scoreAway === null || scoreHome === undefined) continue

      // Intentar encontrar el partido por número de match o por equipos
      // La API de football-data usa nombres en inglés, necesitamos mapear
      const homeTeam = match.homeTeam?.name ?? ''
      const awayTeam = match.awayTeam?.name ?? ''
      const matchday = match.matchday

      // Buscar en nuestra DB por match_number o por equipos
      const partido = partidos?.find((p: any) => {
        // Match por nombres de equipo (aproximado)
        const localMatch = normalizarEquipo(p.equipo_local) === normalizarEquipo(homeTeam)
        const visitanteMatch = normalizarEquipo(p.equipo_visitante) === normalizarEquipo(awayTeam)
        return localMatch && visitanteMatch
      })

      if (!partido) {
        errores.push(`No encontrado: ${homeTeam} vs ${awayTeam}`)
        continue
      }

      const { error } = await supabase.from('partidos').update({
        goles_local: scoreHome,
        goles_visitante: scoreAway,
        resultado_cargado: true,
      }).eq('id', partido.id)

      if (error) {
        errores.push(`Error actualizando ${partido.id}: ${error.message}`)
      } else {
        updated++
      }
    }

    return NextResponse.json({
      message: `Sincronización completada`,
      updated,
      total_finalizados: matches.filter((m: any) => m.status === 'FINISHED').length,
      errores: errores.length > 0 ? errores : undefined,
    })

  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json(
      { error: 'Error interno al sincronizar' },
      { status: 500 }
    )
  }
}

/**
 * Normaliza nombres de equipos para comparación.
 * football-data.org usa inglés, nuestra DB usa español.
 * Mapa de traducción principal.
 */
function normalizarEquipo(nombre: string): string {
  const mapa: Record<string, string> = {
    // Inglés → normalizado
    'argentina': 'argentina',
    'france': 'francia',
    'spain': 'españa',
    'brazil': 'brasil',
    'england': 'inglaterra',
    'portugal': 'portugal',
    'germany': 'alemania',
    'netherlands': 'países bajos',
    'belgium': 'bélgica',
    'uruguay': 'uruguay',
    'morocco': 'marruecos',
    'japan': 'japón',
    'united states': 'estados unidos',
    'usa': 'estados unidos',
    'mexico': 'méxico',
    'croatia': 'croacia',
    'colombia': 'colombia',
    'switzerland': 'suiza',
    'ecuador': 'ecuador',
    'australia': 'australia',
    'norway': 'noruega',
    'senegal': 'senegal',
    'south korea': 'corea del sur',
    'korea republic': 'corea del sur',
    'iran': 'irán',
    'turkey': 'turquía',
    'turkiye': 'turquía',
    'sweden': 'suecia',
    'ivory coast': 'costa de marfil',
    'ghana': 'ghana',
    'saudi arabia': 'arabia saudita',
    'algeria': 'argelia',
    'austria': 'austria',
    'egypt': 'egipto',
    'scotland': 'escocia',
    'south africa': 'sudáfrica',
    'czechia': 'chequia',
    'czech republic': 'chequia',
    'bosnia and herzegovina': 'bosnia y herz.',
    'dr congo': 'rd congo',
    'cape verde': 'cabo verde',
    'tunisia': 'túnez',
    'canada': 'canadá',
    'paraguay': 'paraguay',
    'iraq': 'iraq',
    'qatar': 'qatar',
    'jordan': 'jordania',
    'new zealand': 'nueva zelanda',
    'haiti': 'haití',
    'curacao': 'curazao',
    'panama': 'panamá',
    // Español → normalizado (identity)
    'francia': 'francia',
    'españa': 'españa',
    'brasil': 'brasil',
    'inglaterra': 'inglaterra',
    'alemania': 'alemania',
    'países bajos': 'países bajos',
    'bélgica': 'bélgica',
    'marruecos': 'marruecos',
    'japón': 'japón',
    'estados unidos': 'estados unidos',
    'méxico': 'méxico',
    'croacia': 'croacia',
    'suiza': 'suiza',
    'noruega': 'noruega',
    'corea del sur': 'corea del sur',
    'irán': 'irán',
    'turquía': 'turquía',
    'suecia': 'suecia',
    'costa de marfil': 'costa de marfil',
    'arabia saudita': 'arabia saudita',
    'argelia': 'argelia',
    'egipto': 'egipto',
    'escocia': 'escocia',
    'sudáfrica': 'sudáfrica',
    'chequia': 'chequia',
    'bosnia y herz.': 'bosnia y herz.',
    'rd congo': 'rd congo',
    'cabo verde': 'cabo verde',
    'túnez': 'túnez',
    'canadá': 'canadá',
    'iraq': 'iraq',
    'jordania': 'jordania',
    'nueva zelanda': 'nueva zelanda',
    'haití': 'haití',
    'curazao': 'curazao',
    'panamá': 'panamá',
  }

  const key = nombre.toLowerCase().trim()
  return mapa[key] ?? key
}
