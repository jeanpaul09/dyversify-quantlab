import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=callback`)
    }

    // Verify domain restriction
    const email = data.user?.email || ''
    if (!email.endsWith('@dyversify.com')) {
      // Sign out the non-dyversify user
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?error=domain`)
    }

    // Success — redirect to dashboard
    return NextResponse.redirect(origin)
  }

  // No code present — something went wrong
  return NextResponse.redirect(`${origin}/login?error=callback`)
}
