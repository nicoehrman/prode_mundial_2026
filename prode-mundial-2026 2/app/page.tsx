'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email o contraseña incorrectos'); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Logo / Hero */}
      <div className="text-center mb-10 fade-up">
        <div className="text-6xl mb-3">⚽</div>
        <h1 className="font-display text-5xl tracking-widest text-gold-400 mb-1">
          PRODE
        </h1>
        <h2 className="font-display text-3xl tracking-widest text-white/60">
          MUNDIAL 2026
        </h2>
        <p className="text-white/40 text-sm mt-3">
          Pronosticá, competí y ganá con tus amigos
        </p>
      </div>

      {/* Card Login */}
      <div className="card w-full max-w-sm p-6 fade-up" style={{ animationDelay: '0.1s' }}>
        <h3 className="text-white font-semibold text-base mb-5">Iniciar sesión</h3>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label-text block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label-text block mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 
                          rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-5">
          ¿No tenés cuenta?{' '}
          <Link href="/registro" className="text-gold-400 hover:text-gold-300 transition-colors">
            Registrate
          </Link>
        </p>
      </div>

      {/* Footer info */}
      <p className="text-white/20 text-xs mt-8 text-center">
        11 Jun — 19 Jul 2026 · USA, Canadá, México
      </p>
    </main>
  )
}
