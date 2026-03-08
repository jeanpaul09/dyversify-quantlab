import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Verify the requesting user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email } = await request.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Validate it's a @dyversify.com email
  if (!normalizedEmail.endsWith('@dyversify.com')) {
    return NextResponse.json(
      { error: 'Only @dyversify.com emails can be invited' },
      { status: 400 }
    )
  }

  // Check if already a team member
  const { data: existing } = await supabase
    .from('team_members')
    .select('id, status')
    .eq('email', normalizedEmail)
    .single()

  if (existing && existing.status === 'active') {
    return NextResponse.json(
      { error: 'This person is already a team member' },
      { status: 409 }
    )
  }

  // Check for existing pending invite
  const { data: existingInvite } = await supabase
    .from('team_invites')
    .select('id')
    .eq('email', normalizedEmail)
    .eq('status', 'pending')
    .single()

  if (existingInvite) {
    return NextResponse.json(
      { error: 'An invite is already pending for this email' },
      { status: 409 }
    )
  }

  // Create the invite
  const { data: invite, error: insertError } = await supabase
    .from('team_invites')
    .insert({
      email: normalizedEmail,
      invited_by: user.id,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Invite insert error:', insertError)
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    )
  }

  return NextResponse.json({ invite })
}
