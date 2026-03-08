'use client'

import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/neural/Header'
import { useEffect, useState } from 'react'

interface TeamMember {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  status: string
  joined_at: string | null
  created_at: string
}

interface TeamInvite {
  id: string
  email: string
  status: string
  created_at: string
  expires_at: string
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  const fetchTeamData = async () => {
    setLoading(true)

    const [membersRes, invitesRes] = await Promise.all([
      supabase
        .from('team_members')
        .select('*')
        .in('status', ['active'])
        .order('joined_at', { ascending: true }),
      supabase
        .from('team_invites')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])

    if (membersRes.data) setMembers(membersRes.data)
    if (invitesRes.data) setInvites(invitesRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchTeamData()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setInviting(true)

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
      } else {
        setSuccess(`Invite sent to ${inviteEmail}`)
        setInviteEmail('')
        fetchTeamData()
      }
    } catch {
      setError('Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (memberId: string, email: string) => {
    if (!confirm(`Remove ${email} from the team?`)) return

    setError(null)
    try {
      const res = await fetch('/api/team/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
      } else {
        setSuccess(`${email} has been removed`)
        fetchTeamData()
      }
    } catch {
      setError('Failed to remove member')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-6 flex-shrink-0">
        <Header />
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6 space-y-6">
        {/* Page title */}
        <div>
          <h2 className="text-lg font-bold tracking-[0.2em] text-[var(--text-1)]">
            TEAM MANAGEMENT
          </h2>
          <p className="text-[11px] text-[var(--text-3)] tracking-wider mt-1">
            Manage team members and invitations
          </p>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="p-3 border border-[var(--crimson)] bg-[var(--crimson)]/10 text-[var(--crimson)] text-xs tracking-wider">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 border border-[var(--neon)] bg-[var(--neon)]/10 text-[var(--neon)] text-xs tracking-wider">
            {success}
          </div>
        )}

        {/* Invite form */}
        <div className="neural-panel p-5">
          <h3 className="text-xs font-bold tracking-[0.15em] text-[var(--text-2)] mb-4">
            INVITE TEAM MEMBER
          </h3>
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="name@dyversify.com"
              required
              className="flex-1 px-4 py-2 bg-[var(--graphite-900)] border border-[var(--graphite-400)] text-[var(--text-1)] text-sm tracking-wider placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--neon-dim)] transition-colors"
            />
            <button
              type="submit"
              disabled={inviting}
              className="px-6 py-2 border border-[var(--neon-dim)] text-[var(--neon)] text-xs tracking-widest uppercase hover:bg-[var(--neon)]/10 hover:shadow-[0_0_15px_var(--neon-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {inviting ? 'SENDING...' : 'INVITE'}
            </button>
          </form>
        </div>

        {/* Active members */}
        <div className="neural-panel p-5">
          <h3 className="text-xs font-bold tracking-[0.15em] text-[var(--text-2)] mb-4">
            ACTIVE MEMBERS ({members.length})
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-[var(--neon)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-xs text-[var(--text-3)] tracking-wider py-4 text-center">
              No team members yet
            </p>
          ) : (
            <div className="space-y-1">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-4 py-3 border border-[var(--graphite-400)]/50 hover:border-[var(--graphite-400)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full border border-[var(--graphite-400)]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--graphite-800)] border border-[var(--graphite-400)] flex items-center justify-center text-xs text-[var(--neon)]">
                        {(member.full_name || member.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-[var(--text-1)] tracking-wider">
                        {member.full_name || member.email.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-[var(--text-3)] tracking-wider">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[10px] tracking-wider px-2 py-0.5 border border-[var(--neon-dim)] text-[var(--neon)] bg-[var(--neon)]/5">
                      ACTIVE
                    </span>
                    <button
                      onClick={() => handleRemove(member.id, member.email)}
                      className="text-[10px] tracking-wider text-[var(--text-3)] hover:text-[var(--crimson)] transition-colors cursor-pointer"
                    >
                      REMOVE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending invites */}
        {invites.length > 0 && (
          <div className="neural-panel p-5">
            <h3 className="text-xs font-bold tracking-[0.15em] text-[var(--amber)] mb-4">
              PENDING INVITES ({invites.length})
            </h3>
            <div className="space-y-1">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between px-4 py-3 border border-[var(--graphite-400)]/50"
                >
                  <div>
                    <p className="text-sm text-[var(--text-2)] tracking-wider">
                      {invite.email}
                    </p>
                    <p className="text-[10px] text-[var(--text-3)] tracking-wider">
                      Invited {new Date(invite.created_at).toLocaleDateString()}
                      {' · '}
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-[10px] tracking-wider px-2 py-0.5 border border-[var(--amber)]/50 text-[var(--amber)] bg-[var(--amber)]/5">
                    PENDING
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
