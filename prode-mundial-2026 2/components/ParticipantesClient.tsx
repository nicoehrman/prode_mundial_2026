'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/lib/types'
import { ChevronLeft, CheckCircle, XCircle, Edit2, Save } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

export default function ParticipantesClient({
  perfiles: perfilesIniciales,
  inscripcion,
}: {
  perfiles: Perfil[]
  inscripcion: number
}) {
  const supabase = createClient()
  const [perfiles, setPerfiles] = useState(perfilesIniciales)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingMonto, setEditingMonto] = useState<string | null>(null)
  const [montoTemp, setMontoTemp] = useState('')

  const totalRecaudado = perfiles
    .filter(p => p.pago)
    .reduce((sum, p) => sum + (p.monto_pagado || inscripcion), 0)

  const pagaron = perfiles.filter(p => p.pago).length

  async function togglePago(perfil: Perfil) {
    setSaving(perfil.id)
    const nuevoPago = !perfil.pago
    const ahora = nuevoPago ? new Date().toISOString() : null
    const monto = nuevoPago ? (perfil.monto_pagado || inscripcion) : 0

    const { error } = await supabase.from('perfiles').update({
      pago: nuevoPago,
      fecha_pago: ahora,
      monto_pagado: monto,
    }).eq('id', perfil.id)

    if (!error) {
      setPerfiles(prev => prev.map(p =>
        p.id === perfil.id
          ? { ...p, pago: nuevoPago, fecha_pago: ahora, monto_pagado: monto }
          : p
      ))
    }
    setSaving(null)
  }

  async function guardarMonto(perfil: Perfil) {
    const monto = parseFloat(montoTemp)
    if (isNaN(monto) || monto < 0) return
    setSaving(perfil.id)
    await supabase.from('perfiles').update({ monto_pagado: monto }).eq('id', perfil.id)
    setPerfiles(prev => prev.map(p =>
      p.id === perfil.id ? { ...p, monto_pagado: monto } : p
    ))
    setSaving(null)
    setEditingMonto(null)
  }

  async function updateInscripcion(nuevoMonto: number) {
    await supabase.from('pozo_config').update({ monto_inscripcion: nuevoMonto }).eq('id', 1)
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-white/40 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-3xl tracking-wider text-gold-400">PARTICIPANTES</h1>
          <p className="text-white/40 text-xs">Gestión de pagos y confirmaciones</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3 text-center">
          <p className="text-white font-bold text-xl">{perfiles.length}</p>
          <p className="text-white/40 text-[10px] mt-0.5">REGISTRADOS</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-green-400 font-bold text-xl">{pagaron}</p>
          <p className="text-white/40 text-[10px] mt-0.5">PAGARON</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-gold-400 font-bold text-lg">
            ${totalRecaudado.toLocaleString('es-AR')}
          </p>
          <p className="text-white/40 text-[10px] mt-0.5">RECAUDADO</p>
        </div>
      </div>

      {/* Tabla de participantes */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            Lista de participantes
          </p>
        </div>

        <div className="divide-y divide-white/5">
          {perfiles.map(perfil => (
            <div key={perfil.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{perfil.nombre}</span>
                    {perfil.is_admin && (
                      <span className="text-[9px] font-bold text-gold-400/60 bg-gold-400/10 px-1.5 py-0.5 rounded">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-white/30 text-[10px] mt-0.5">{perfil.email}</p>
                  {perfil.fecha_pago && (
                    <p className="text-white/20 text-[10px]">
                      Pagó el {new Date(perfil.fecha_pago).toLocaleDateString('es-AR')}
                    </p>
                  )}
                </div>

                {/* Monto pagado */}
                <div className="flex items-center gap-2 shrink-0">
                  {editingMonto === perfil.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-white/40 text-xs">$</span>
                      <input
                        type="number"
                        value={montoTemp}
                        onChange={e => setMontoTemp(e.target.value)}
                        className="w-20 text-xs bg-white/5 border border-white/20 rounded px-2 py-1 
                                   text-white focus:outline-none focus:border-gold-500/50"
                        autoFocus
                      />
                      <button
                        onClick={() => guardarMonto(perfil)}
                        disabled={saving === perfil.id}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Save size={14} />
                      </button>
                    </div>
                  ) : (
                    perfil.pago && (
                      <button
                        onClick={() => { setEditingMonto(perfil.id); setMontoTemp(String(perfil.monto_pagado || inscripcion)) }}
                        className="flex items-center gap-1 text-white/40 hover:text-white/60 text-xs"
                      >
                        ${(perfil.monto_pagado || inscripcion).toLocaleString('es-AR')}
                        <Edit2 size={10} />
                      </button>
                    )
                  )}

                  {/* Toggle pago */}
                  <button
                    onClick={() => togglePago(perfil)}
                    disabled={saving === perfil.id}
                    className={clsx(
                      'flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all',
                      'border disabled:opacity-50 disabled:cursor-not-allowed',
                      perfil.pago
                        ? 'bg-green-400/10 border-green-400/20 text-green-400 hover:bg-green-400/20'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
                    )}
                  >
                    {perfil.pago
                      ? <><CheckCircle size={11} /> Pagó</>
                      : <><XCircle size={11} /> Pendiente</>
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}

          {perfiles.length === 0 && (
            <div className="py-8 text-center text-white/30 text-sm">
              No hay participantes registrados
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
