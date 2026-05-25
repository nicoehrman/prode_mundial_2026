import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Settings, Users, Trophy, RefreshCw } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: totalPartidos },
    { count: conResultado },
    { count: totalUsuarios },
    { count: pagaron },
  ] = await Promise.all([
    supabase.from('partidos').select('*', { count: 'exact', head: true }),
    supabase.from('partidos').select('*', { count: 'exact', head: true }).eq('resultado_cargado', true),
    supabase.from('perfiles').select('*', { count: 'exact', head: true }),
    supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('pago', true),
  ])

  const opciones = [
    {
      href: '/admin/resultados',
      icon: Trophy,
      title: 'Cargar resultados',
      desc: `${conResultado ?? 0} de ${totalPartidos ?? 104} partidos cargados`,
      color: 'text-gold-400',
    },
    {
      href: '/admin/participantes',
      icon: Users,
      title: 'Gestionar participantes',
      desc: `${totalUsuarios ?? 0} registrados, ${pagaron ?? 0} confirmaron pago`,
      color: 'text-blue-400',
    },
  ]

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings size={16} className="text-gold-400" />
          <h1 className="font-display text-3xl tracking-wider text-gold-400">ADMIN</h1>
        </div>
        <p className="text-white/40 text-xs">Panel de administración</p>
      </div>

      <div className="space-y-3">
        {opciones.map(({ href, icon: Icon, title, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="card p-4 flex items-center gap-4 hover:border-white/20 
                       transition-all active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Icon size={18} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{title}</p>
              <p className="text-white/40 text-xs mt-0.5">{desc}</p>
            </div>
            <span className="text-white/20">›</span>
          </Link>
        ))}
      </div>

      {/* Sincronización API */}
      <SyncButton />
    </div>
  )
}

function SyncButton() {
  return (
    <form action="/api/sync-results" method="POST">
      <button
        type="submit"
        className="card w-full p-4 flex items-center gap-4 hover:border-white/20 
                   transition-all text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
          <RefreshCw size={18} className="text-green-400" />
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">Sincronizar resultados (API)</p>
          <p className="text-white/40 text-xs mt-0.5">
            Actualiza automáticamente desde football-data.org
          </p>
        </div>
        <span className="text-white/20">›</span>
      </button>
    </form>
  )
}
