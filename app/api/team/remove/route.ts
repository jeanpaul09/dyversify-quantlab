import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Verify the requesting user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { memberId } = await request.json()

  if (!memberId) {
    return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
  }

  // Prevent self-removal
  const { data: member } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('id', memberId)
    .single()

  if (member?.user_id === user.id) {
    return NextResponse.json(
      { error: 'You cannot remove yourself' },
      { status: 400 }
    )
  }

  // Update status to removed
  const { error: updateError } = await supabase
    .from('team_members')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('id', memberId)

  if (updateError) {
    console.error('Remove member error:', updateError)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
