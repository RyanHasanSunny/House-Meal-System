import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, getApiErrorMessage } from '../api/client'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { formatDate } from '../lib/format'
import { useAuth } from '../providers/AuthProvider'
import type { User } from '../types'

type ProfileFormState = {
  name: string
  username: string
  email: string
  phone: string
}

type PasswordFormState = {
  current_password: string
  password: string
  password_confirmation: string
}

const emptyPasswordForm: PasswordFormState = {
  current_password: '',
  password: '',
  password_confirmation: '',
}

function toProfileForm(user: User): ProfileFormState {
  return {
    name: user.name,
    username: user.username,
    email: user.email ?? '',
    phone: user.phone ?? '',
  }
}

export function AccountSettingsPage() {
  const { user, syncUser } = useAuth()
  const [profileForm, setProfileForm] = useState<ProfileFormState | null>(user ? toProfileForm(user) : null)
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPasswordForm)
  const [profileError, setProfileError] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }

    setProfileForm(toProfileForm(user))
  }, [user])

  if (!user || !profileForm) {
    return null
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!profileForm) {
      return
    }

    setProfileError('')
    setProfileMessage('')
    setIsProfileSubmitting(true)

    try {
      const payload = {
        ...profileForm,
        email: profileForm.email.trim() || null,
        phone: profileForm.phone.trim() || null,
      }

      const response = await api.patch<{ message: string; user: User }>('/auth/profile', payload)

      syncUser(response.data.user)
      setProfileMessage(response.data.message)
    } catch (submitError) {
      setProfileError(getApiErrorMessage(submitError))
    } finally {
      setIsProfileSubmitting(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError('')
    setPasswordMessage('')
    setIsPasswordSubmitting(true)

    try {
      const response = await api.patch<{ message: string }>('/auth/password', passwordForm)
      setPasswordForm(emptyPasswordForm)
      setPasswordMessage(response.data.message)
    } catch (submitError) {
      setPasswordError(getApiErrorMessage(submitError))
    } finally {
      setIsPasswordSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Account Overview</p>
            <h2 className="mt-2 text-2xl font-bold">{user.name}</h2>
            <p className="mt-2 text-sm text-stone-500">
              @{user.username}
              {user.email ? ` | ${user.email}` : ''}
              {user.phone ? ` | ${user.phone}` : ''}
            </p>
            <p className="mt-2 text-sm text-stone-500">
              Joined {user.joined_at ? formatDate(user.joined_at) : 'Not set'}
            </p>
          </div>
          <Badge variant="brand">{user.role_label}</Badge>
        </div>
      </Card>

      <div className="grid gap-3 xl:grid-cols-2">
        <Card>
          <div>
            <h2 className="text-2xl font-bold">Update Information</h2>
            <p className="mt-2 text-sm text-stone-500">Change your personal details and username here.</p>
          </div>

          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleProfileSubmit}>
            <div className="md:col-span-2">
              <label className="field-label">Full Name</label>
              <Input
                value={profileForm.name}
                onChange={(event) => setProfileForm((current) => current ? { ...current, name: event.target.value } : current)}
              />
            </div>
            <div>
              <label className="field-label">Username</label>
              <Input
                value={profileForm.username}
                onChange={(event) => setProfileForm((current) => current ? { ...current, username: event.target.value } : current)}
              />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <Input
                value={profileForm.phone}
                onChange={(event) => setProfileForm((current) => current ? { ...current, phone: event.target.value } : current)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="field-label">Email</label>
              <Input
                type="email"
                value={profileForm.email}
                onChange={(event) => setProfileForm((current) => current ? { ...current, email: event.target.value } : current)}
              />
            </div>

            {profileError ? (
              <div className="md:col-span-2 rounded-md border border-danger-100 bg-danger-100/60 px-3 py-2.5 text-sm font-medium whitespace-pre-line text-danger-500">
                {profileError}
              </div>
            ) : null}

            {profileMessage ? (
              <div className="md:col-span-2 rounded-md border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700">
                {profileMessage}
              </div>
            ) : null}

            <div className="md:col-span-2">
              <Button className="w-full sm:w-auto" disabled={isProfileSubmitting} type="submit">
                {isProfileSubmitting ? 'Saving...' : 'Save Information'}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <div>
            <h2 className="text-2xl font-bold">Change Password</h2>
            <p className="mt-2 text-sm text-stone-500">Use your current password to set a new one.</p>
          </div>

          <form className="mt-4 space-y-3" onSubmit={handlePasswordSubmit}>
            <div>
              <label className="field-label">Current Password</label>
              <Input
                autoComplete="current-password"
                type="password"
                value={passwordForm.current_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, current_password: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="field-label">New Password</label>
              <Input
                autoComplete="new-password"
                type="password"
                value={passwordForm.password}
                onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
              />
            </div>
            <div>
              <label className="field-label">Confirm New Password</label>
              <Input
                autoComplete="new-password"
                type="password"
                value={passwordForm.password_confirmation}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, password_confirmation: event.target.value }))
                }
              />
            </div>

            {passwordError ? (
              <div className="rounded-md border border-danger-100 bg-danger-100/60 px-3 py-2.5 text-sm font-medium whitespace-pre-line text-danger-500">
                {passwordError}
              </div>
            ) : null}

            {passwordMessage ? (
              <div className="rounded-md border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700">
                {passwordMessage}
              </div>
            ) : null}

            <Button className="w-full sm:w-auto" disabled={isPasswordSubmitting} type="submit">
              {isPasswordSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
