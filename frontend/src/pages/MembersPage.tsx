import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { RefreshCcw, UserPlus, Users } from 'lucide-react'
import { api, getApiErrorMessage } from '../api/client'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Select } from '../components/ui/Select'
import { Spinner } from '../components/ui/Spinner'
import { TypedDeleteModal } from '../components/ui/TypedDeleteModal'
import { useAuth } from '../providers/AuthProvider'
import type { Role, User } from '../types'
import { formatDate, todayValue } from '../lib/format'

const initialForm = {
  name: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  role: 'member' as Role,
  joined_at: todayValue(),
}

export function MembersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [transferTarget, setTransferTarget] = useState<User | null>(null)
  const [transferingUserId, setTransferingUserId] = useState<number | null>(null)

  async function loadUsers() {
    const response = await api.get<{ data: User[] }>('/users')
    setUsers(response.data.data)
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        await loadUsers()
      } catch (loadError) {
        setError(getApiErrorMessage(loadError))
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrap()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      const payload = {
        ...form,
        role: user?.role === 'super_admin' ? form.role : 'member',
      }

      const response = await api.post<{ data: User; message: string }>('/users', payload)
      setUsers((current) => [...current, response.data.data].sort((a, b) => a.name.localeCompare(b.name)))
      setForm({ ...initialForm, role: user?.role === 'super_admin' ? 'member' : form.role })
      setMessage(response.data.message)
    } catch (submitError) {
      setError(getApiErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleStatus(target: User) {
    setError('')
    setMessage('')

    try {
      const response = await api.patch<{ data: User; message: string }>(`/users/${target.id}`, {
        is_active: !target.is_active,
      })
      setUsers((current) => current.map((entry) => (entry.id === target.id ? response.data.data : entry)))
      setMessage(response.data.message)
    } catch (toggleError) {
      setError(getApiErrorMessage(toggleError))
    }
  }

  function openTransferModal(target: User) {
    setError('')
    setMessage('')
    setTransferTarget(target)
  }

  async function handleTransferAdmin(payload: { confirmation_text: string }) {
    if (!transferTarget) {
      return
    }

    setError('')
    setMessage('')
    setTransferingUserId(transferTarget.id)

    try {
      const response = await api.post<{ current_admin: User; previous_admin: User; message: string }>('/users/transfer-admin', {
        target_user_id: transferTarget.id,
        ...payload,
      })

      await loadUsers()
      setTransferTarget(null)
      setMessage(response.data.message)
    } catch (transferError) {
      setError(getApiErrorMessage(transferError))
    } finally {
      setTransferingUserId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="panel flex min-h-[320px] items-center justify-center">
        <Spinner label="Loading members..." />
      </div>
    )
  }

  const currentAdmin = users.find((entry) => entry.role === 'admin') ?? null
  const members = users.filter((entry) => entry.role === 'member')

  return (
    <div className="space-y-3">
      <SectionHeading title="Members & Roles" />

      <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Current Weekly Admin</p>
              <h2 className="mt-2 text-2xl font-bold">{currentAdmin ? currentAdmin.name : 'No admin assigned'}</h2>
              {currentAdmin ? <p className="mt-2 text-sm text-stone-600">@{currentAdmin.username}</p> : null}
            </div>
            {currentAdmin ? <Badge variant="accent">Active house admin</Badge> : null}
          </div>
      </Card>

      <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-md bg-brand-100 p-3 text-brand-700">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Add User</h2>
            </div>
          </div>

          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="md:col-span-2">
              <label className="field-label">Full Name</label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div>
              <label className="field-label">Username</label>
              <Input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} />
            </div>
            <div>
              <label className="field-label">Password</label>
              <Input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            </div>
            <div>
              <label className="field-label">Email</label>
              <Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </div>
            <div>
              <label className="field-label">Joined At</label>
              <Input type="date" value={form.joined_at} onChange={(event) => setForm((current) => ({ ...current, joined_at: event.target.value }))} />
            </div>
            <div>
              <label className="field-label">Role</label>
              <Select
                disabled={user?.role !== 'super_admin'}
                value={user?.role === 'super_admin' ? form.role : 'member'}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}
              >
                <option value="member">Member</option>
                {user?.role === 'super_admin' ? <option value="admin">Admin</option> : null}
              </Select>
            </div>

            {error ? (
              <div className="md:col-span-2 rounded-md border border-danger-100 bg-danger-100/60 px-3 py-2.5 text-sm font-medium whitespace-pre-line text-danger-500">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="md:col-span-2 rounded-md border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700">
                {message}
              </div>
            ) : null}

            <div className="md:col-span-2">
              <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-3">
          {users.length ? (
            users.map((entry) => (
              <Card key={entry.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold">{entry.name}</h2>
                      <Badge variant={entry.role === 'member' ? 'brand' : 'accent'}>{entry.role_label}</Badge>
                      <Badge variant={entry.is_active ? 'brand' : 'danger'}>
                        {entry.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-stone-500">
                      @{entry.username}
                      {entry.email ? ` | ${entry.email}` : ''}
                      {entry.phone ? ` | ${entry.phone}` : ''}
                    </p>
                    <p className="mt-2 text-sm text-stone-500">Joined {entry.joined_at ? formatDate(entry.joined_at) : 'Not set'}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {entry.role === 'member' ? (
                      <Button variant={entry.is_active ? 'ghost' : 'secondary'} onClick={() => handleToggleStatus(entry)}>
                        {entry.is_active ? 'Set Inactive' : 'Reactivate'}
                      </Button>
                    ) : null}
                    {entry.role === 'member' && entry.is_active ? (
                      <Button
                        disabled={transferingUserId === entry.id}
                        variant="secondary"
                        onClick={() => openTransferModal(entry)}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        {transferingUserId === entry.id ? 'Transferring...' : 'Make Admin'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))
          ) : <EmptyState icon={Users} title="No users found" />}
        </div>
      </div>

      {members.length ? (
        <Card>
          <h2 className="text-2xl font-bold">Transfer Candidates</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {members.map((member) => (
              <div key={member.id} className="rounded-md border border-stone-200 bg-stone-50 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-950">{member.name}</p>
                    <p className="mt-1 text-sm text-stone-500">@{member.username}</p>
                  </div>
                  <Badge variant={member.is_active ? 'brand' : 'danger'}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <TypedDeleteModal
        error={error}
        isOpen={transferTarget !== null}
        isSubmitting={transferingUserId === transferTarget?.id}
        submitLabel="Transfer Admin"
        submittingLabel="Transferring..."
        targetDescription={
          transferTarget
            ? `${transferTarget.name} | @${transferTarget.username} | ${transferTarget.is_active ? 'Active member' : 'Inactive member'}`
            : ''
        }
        targetFieldLabel="Type the exact target member handle"
        targetLabel={transferTarget ? `@${transferTarget.username}` : ''}
        title="Transfer Admin Role"
        onClose={() => setTransferTarget(null)}
        onConfirm={(payload) => handleTransferAdmin(payload)}
      />
    </div>
  )
}
