import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Rutas públicas (login, registro)
  const publicPaths = ['/', '/registro', '/auth/callback']
  if (publicPaths.includes(path)) {
    // Si ya está logueado y va al login, redirigir al dashboard
    if (user && (path === '/' || path === '/registro')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // Rutas protegidas: si no está logueado, al login
  if (!user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Rutas de admin: verificar is_admin
  if (path.startsWith('/admin')) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!perfil?.is_admin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
