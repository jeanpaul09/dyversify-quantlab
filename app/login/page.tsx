'use client'

import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')

  // Check if already authenticated — redirect to dashboard
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/')
    })
  }, [router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          hd: 'dyversify.com',
        },
      },
    })

    if (error) {
      console.error('OAuth error:', error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--void)] relative overflow-hidden font-mono">

      {/* ═══ ANIMATED BACKGROUND ═══ */}

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(var(--graphite-400) 1px, transparent 1px), linear-gradient(90deg, var(--graphite-400) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Animated chart lines — subtle pulsating equity curves */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 800">
        {/* Green rising curves */}
        <path
          d="M0,650 Q100,640 200,600 T400,520 T600,440 T800,350 T1000,280 T1200,200"
          fill="none"
          stroke="var(--neon)]"
          strokeWidth="1"
          opacity="0"
          className="animate-chartPulse1"
        />
        <path
          d="M0,700 Q150,69o 300,200 T500,200 T700,200 T900,200 T1100,200 T1200,200"
          fill="none"
          stroke="var(--neon)"
          strokeWidth="0.8"
          opacity="0"
          className="animate-chartPulse2"
        />
        <path
          d="M0,550 Q80,545 160,530 T320,490 T480,430 T640,380 T800,350 T960,300 T1200,250"
          fill="none"
          stroke="var(--neon)]"
          strokeWidth="0.6"
          opacity="0"
          className="animate-chartPulse3"
        />

        {/* Red falling curves */}
        <path
          d="M0,200 Q120,220 240,280 T480,380 T720,460 T960,530 T1200,600"
          fill="none"
          stroke="var(--crimson)]"
          strokeWidth="0.8"
          opacity="0"
          className="animate-chartPulse4"
        />
        <path
          d="M0,300 Q100,310 200,350 T400,430 T600,500 T800,560 T1000,610 T1200,650"
          fill="none"
          stroke="var(--crimson)"
          strokeWidth="0.6"
          opacity="0"
          className="animate-chartPulse5"
        />

        {/* Subtle horizontal grid lines that pulse */}
        {[200, 300, 400, 500, 600].map((y, i) => (
          <line
            key={y}
            x1="0" y1={y} x2="1200" y2={y}
            stroke="var(--graphite-400)"
            strokeWidth="0.5"
            opacity="0"
            className={`animate-gridFade${(i % 3) + 1}`}
          />
        ))}
      </svg>

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, var(--void) 80%)',
        }}
      />

      {/* ═══ LOGIN CARD ═══ */}
      <div className="relative z-10 w-full max-w-sm mx-6">
        <div
          className="border border-[var(--graphite-400)] bg-[var(--void)]/90 backdrop-blur-sm p-10 space-y-8"
          style={{ boxShadow: '0 0 60px rgba(0,255,136,0.03)' }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-5">
            <div className="w-14 h-14 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 12px rgba(0,255,136,0.3))' }}>
                <polygon
                  points="50,10 90,90 10,90"
                  fill="none"
                  stroke="var(--neon)"
                  strokeWidth="2.5"
                />
                <polygon
                  points="50,35 70,75 30,75"
                  fill="var(--neon)"
                  opacity="0.9"
                />
              </svg>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold tracking-[0.35em] text-[var(--text-1)]">
                DYVERSIFY
              </h1>
              <p className="text-[9px] text-[var(--text-3)] tracking-[0.5em] uppercase">
                Algorithmic Intelligence
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--graphite-300)] to-transparent" />

          {/* Error messages */}
          {error === 'domain' && (
            <div className="p-3 border border-[var(--crimson)]/40 bg-[var(--crimson)]/5 text-[var(--crimson)] text-[10px] tracking-wider text-center uppercase">
              Access Denied — @dyversify.com accounts only
            </div>
          )}
          {error === 'callback' && (
            <div className="p-3 border border-[var(--crimson)]/40 bg-[var(--crimson)]/5 text-[var(--crimson)] text-[10px] tracking-wider text-center uppercase">
              Authentication Error — Please try again
            </div>
          )}

          {/* Sign in button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border border-[var(--graphite-300)] bg-[var(--graphite-900)] hover:border-[var(--neon)]/50 hover:bg-[var(--graphite-800)] transition-all duration-300 text-xs tracking-[0.2em] uppercase text-[var(--text-2)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer group"
            style={{ transition: 'all 0.3s ease' }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border border-[var(--neon)] border-t-transparent rounded-full animate-spin" />
                <span className="text-[var(--neon)] text-[10px]">Authenticating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-[var(--text-3)] group-hover:text-[var(--text-2)] transition-colors" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="group-hover:text-[var(--text-1)] transition-colors text-[10px]">
                  Sign in with Google
                </span>
              </>
            )}
          </button>

          {/* Footer */}
          <p className="text-[8px] text-[var(--text-3)]/60 text-center tracking-[0.4em] uppercase">
            Internal Access Only
          </p>
        </div>
      </div>

      {/* ═══ KEYFRAME STYLES ═══ */}
      <style jsx>{`
        @keyframes chartPulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.06; }
        }
        @keyframes chartPulseAlt {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.04; }
        }
        @keyframes gridFade {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.06; }
        }

        :global(.animate-chartPulse1) {
          animation: chartPulse 8s ease-in-out infinite;
        }
        :global(.animate-chartPulse2) {
          animation: chartPulse 10s ease-in-out infinite 1s;
        }
        :global(.animate-chartPulse3) {
          animation: chartPulse 12s ease-in-out infinite 2s;
        }
        :global(.animate-chartPulse4) {
          animation: chartPulseAlt 9s ease-in-out infinite 0.5s;
        }
        :global(.animate-chartPulse5) {
          animation: chartPulseAlt 11s ease-in-out infinite 1.5s;
        }
        :global(.animate-gridFade1) {
          animation: gridFade 6s ease-in-out infinite;
        }
        :global(.animate-gridFade2) {
          animation: gridFade 6s ease-in-out infinite 2s;
        }
        :global(.animate-gridFade3) {
          animation: gridFade 6s ease-in-out infinite 4s;
        }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[var(--void)]">
          <div className="w-5 h-5 border border-[var(--neon)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
