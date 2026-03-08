'use client'

import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const handleGoogleSignIn = async () => {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          hd: 'dyversify.com', // Restrict Google prompt to @dyversify.com
        },
      },
    })

    if (error) {
      console.error('OAuth error:', error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--void)] relative overflow-hidden">
      {/* Background effects */}
      <div className="dot-grid" />
      <div className="scanlines pointer-events-none" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="neural-panel p-8 space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_var(--neon-glow)]">
                <polygon
                  points="50,10 90,90 10,90"
                  fill="none"
                  stroke="var(--neon)"
                  strokeWidth="3"
                />
                <polygon
                  points="50,35 70,75 30,75"
                  fill="var(--neon)"
                />
              </svg>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-[0.3em] text-[var(--text-1)] text-glow-neon">
                DIVERSIFY
              </h1>
              <p className="text-[10px] text-[var(--text-3)] tracking-[0.4em] uppercase mt-2">
                Algorithmic Intelligence Unit
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--graphite-400)] to-transparent" />

          {/* Error message */}
          {error === 'domain' && (
            <div className="p-3 border border-[var(--crimson)] bg-[var(--crimson)]/10 text-[var(--crimson)] text-xs tracking-wider text-center">
              ACCESS DENIED — Only @dyversify.com accounts are authorized
            </div>
          )}
          {error === 'callback' && (
            <div className="p-3 border border-[var(--crimson)] bg-[var(--crimson)]/10 text-[var(--crimson)] text-xs tracking-wider text-center">
              AUTHENTICATION ERROR — Please try again
            </div>
          )}

          {/* Sign in button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-[var(--graphite-400)] bg-[var(--graphite-900)] hover:border-[var(--neon)] hover:shadow-[0_0_20px_var(--neon-glow)] transition-all duration-300 text-sm tracking-widest uppercase text-[var(--text-1)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[var(--neon)] border-t-transparent rounded-full animate-spin" />
                <span className="text-[var(--neon)]">AUTHENTICATING...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="group-hover:text-[var(--neon)] transition-colors">
                  Sign in with Google
                </span>
              </>
            )}
          </button>

          {/* Footer note */}
          <p className="text-[10px] text-[var(--text-3)] text-center tracking-wider">
            RESTRICTED ACCESS — @dyversify.com accounts only
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[var(--void)]">
          <div className="w-6 h-6 border-2 border-[var(--neon)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
