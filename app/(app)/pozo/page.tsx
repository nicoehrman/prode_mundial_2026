import { createClient } from '@/lib/supabase/server'
import type { Perfil } from '@/lib/types'

export const revalidate = 60

export default async function PozoPage() {
  const supabase = await createClient()

  const [
    { data: perfiles },
    { data: pozoArr },
  ] = await Promise.all([
    supabase.from('perfiles').select('id, nombre, pago, monto_pagado, fecha_pago').order('nombre'),
    supabase.from('pozo_config').select('*').eq('id', 1).single(),
  ])

  const pozo = pozoArr?.data
  const inscripcion = pozo?.monto_inscripcion ?? 5000
  const participantes = (perfiles as Perfil[]) ?? []
  const pagaron = participantes.filter(p => p.pago)
  const totalRecaudado = pagaron.reduce((sum, p) => sum + (p.monto_pagado || inscripcion), 0)

  const premio1 = Math.round(totalRecaudado * 0.70)
  const premio2 = Math.max(0, Math.round(totalRecaudado * 0.30) - inscripcion)
  const premio3 = inscripcion

  function formatPesos(n: number) {
    return '$' + n.toLocaleString('es-AR')
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="font-display text-3xl tracking-wider text-gold-400">EL POZO</h1>
        <p className="text-white/40 text-xs mt-0.5">
          {pagaron.length} de {participantes.length} participantes confirmados
        </p>
      </div>

      {/* Total recaudado */}
      <div className="card p-5 text-center border border-gold-500/20">
        <p className="text-white/40 text-xs uppercase tracking-wider mb-2">
          Total en juego
        </p>
        <p className="font-display text-5xl tracking-widest text-gold-400">
          {formatPesos(totalRecaudado)}
        </p>
        <p className="text-white/30 text-xs mt-2">
          Inscripción: {formatPesos(inscripcion)} c/u
        </p>
      </div>

      {/* Distribución de premios */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            🏆 Distribución de premios
          </p>
        </div>
        <div className="divide-y divide-white/5">
          {[
            { pos: '🥇 1° puesto',  pct: '70%', monto: premio1,  color: 'text-gold-400' },
            { pos: '🥈 2° puesto',  pct: '30% − inscripción', monto: premio2, color: 'text-white' },
            { pos: '🥉 3° puesto',  pct: 'Devolución', monto: premio3, color: 'text-white/60' },
          ].map(({ pos, pct, monto, color }) => (
            <div key={pos} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-white text-sm font-medium">{pos}</p>
                <p className="text-white/30 text-xs">{pct}</p>
              </div>
              <p className={`font-bold text-lg ${color}`}>{formatPesos(monto)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de participantes */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            Participantes
          </p>
        </div>
        <div className="divide-y divide-white/5">
          {participantes.map(p => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-white text-sm">{p.nombre}</span>
              <div className="flex items-center gap-2">
                {p.pago ? (
                  <span className="text-green-400 text-xs font-semibold bg-green-400/10 
                                   border border-green-400/20 px-2 py-0.5 rounded-full">
                    ✓ Pagó
                  </span>
                ) : (
                  <span className="text-white/25 text-xs bg-white/5 border border-white/10 
                                   px-2 py-0.5 rounded-full">
                    Pendiente
                  </span>
                )}
              </div>
            </div>
          ))}
          {participantes.length === 0 && (
            <div className="py-8 text-center text-white/30 text-sm">
              Todavía no hay participantes
            </div>
          )}
        </div>
      </div>

      <p className="text-white/20 text-[10px] text-center">
        El monto se acredita vía MercadoPago y se guarda hasta la final del 19 de julio
      </p>
    </div>
  )
}
