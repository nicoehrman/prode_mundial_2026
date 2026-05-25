import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBottom from '@/components/NavBottom'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20">
        {children}
      </main>
      <NavBottom isAdmin={perfil?.is_admin ?? false} />
    </div>
  )
}
