'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Trophy, Pencil, Wallet, Settings } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard',    icon: BarChart3,  label: 'Tabla'     },
  { href: '/partidos',     icon: Trophy,     label: 'Partidos'  },
  { href: '/pronosticos',  icon: Pencil,     label: 'Pronóst.'  },
  { href: '/pozo',         icon: Wallet,     label: 'Pozo'      },
]

export default function NavBottom({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname()

  const items = isAdmin
    ? [...navItems, { href: '/admin', icon: Settings, label: 'Admin' }]
    : navItems

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-white/10
                    bg-navy-900/95 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-2">
        {items.map(({ href, icon: Icon, label }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl',
                'transition-all duration-200 min-w-[56px]',
                active
                  ? 'text-gold-400'
                  : 'text-white/40 hover:text-white/60'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className={clsx('text-[10px] font-medium', active ? 'text-gold-400' : '')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
