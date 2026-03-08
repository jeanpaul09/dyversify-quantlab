'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          router.replace('/login')
        } else {
          setUser(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return { user, loading, signOut }
}
