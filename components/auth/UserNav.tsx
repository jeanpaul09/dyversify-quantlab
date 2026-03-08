'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

export function UserNav() {
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-3 px-3 py-1.5 border border-[var(--graphite-400)] hover:border-[var(--neon-dim)] transition-colors cursor-pointer"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-6 h-6 rounded-full border border-[var(--graphite-400)]"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[var(--graphite-800)] border border-[var(--graphite-400)] flex items-center justify-center text-[10px] text-[var(--neon)]">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-[10px] tracking-wider text-[var(--text-2)] hidden sm:inline">
          {displayName.toUpperCase()}
        </span>
        <svg
          className={`w-3 h-3 text-[var(--text-3)] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {menuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-48 z-50 neural-panel p-1 border border-[var(--graphite-400)]">
            <div className="px-3 py-2 border-b border-[var(--graphite-400)]">
              <p className="text-[10px] text-[var(--text-3)] tracking-wider">SIGNED IN AS</p>
              <p className="text-xs text-[var(--text-2)] truncate mt-0.5">{user.email}</p>
            </div>

            <Link
              href="/team"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-[11px] tracking-wider text-[var(--text-2)] hover:text-[var(--neon)] hover:bg-[var(--graphite-900)] transition-colors"
            >
              TEAM MANAGEMENT
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 text-[11px] tracking-wider text-[var(--crimson)] hover:bg-[var(--graphite-900)] transition-colors cursor-pointer"
            >
              SIGN OUT
            </button>
          </div>
        </>
      )}
    </div>
  )
}
