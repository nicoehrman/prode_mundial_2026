'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegistroPage() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } }
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Ya existe una cuenta con ese email'
        : 'Error al registrarse. Intentá de nuevo.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center mb-8 fade-up">
        <div className="text-5xl mb-2">⚽</div>
        <h1 className="font-display text-4xl tracking-widest text-gold-400">PRODE 2026</h1>
      </div>

      <div className="card w-full max-w-sm p-6 fade-up" style={{ animationDelay: '0.1s' }}>
        <h3 className="text-white font-semibold text-base mb-5">Crear cuenta</h3>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="label-text block mb-1.5">Tu nombre / apodo</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="input-field"
              placeholder="Ej: Pepe, El Turco..."
              required
              maxLength={30}
            />
          </div>
          <div>
            <label className="label-text block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label className="label-text block mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="label-text block mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="input-field"
              placeholder="Repetí tu contraseña"
              required
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
            disabled={loading || !nombre || !email || !password || !confirm}
            className="btn-primary w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-5">
          ¿Ya tenés cuenta?{' '}
          <Link href="/" className="text-gold-400 hover:text-gold-300 transition-colors">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </main>
  )
}
