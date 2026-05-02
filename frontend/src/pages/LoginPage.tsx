import { LockKeyhole, NotebookTabs, ShieldCheck, Users } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../api/client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAuth } from '../providers/AuthProvider'

const highlights = [
  {
    icon: ShieldCheck,
    title: 'Role-based control',
    copy: 'Super admin, admin, and members each get only the actions they should touch.',
  },
  {
    icon: NotebookTabs,
    title: 'Meal-plan clarity',
    copy: 'Weekly, monthly, and custom planning stays visible in one place.',
  },
  {
    icon: Users,
    title: 'Member-first flow',
    copy: 'Members simply mark the meals they cannot take. Everything else counts automatically.',
  },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({
    username: 'superadmin',
    password: 'password123',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(form)
      navigate('/')
    } catch (submitError) {
      setError(getApiErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel subtle-grid relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-r from-accent-100 via-transparent to-brand-100 opacity-90" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Bachelor House Operations</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
              Sharp control over meals, members, and monthly grocery cost.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600">
              Built for fast daily house management with a clean admin workflow and a simple mobile-first member experience.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {highlights.map(({ icon: Icon, title, copy }) => (
                <Card key={title} className="bg-white/90">
                  <div className="mb-4 inline-flex rounded-2xl bg-brand-100 p-3 text-brand-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{copy}</p>
                </Card>
              ))}
            </div>

            <div className="mt-8 rounded-[24px] bg-ink-950 p-5 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-300">Demo Access</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-300">Super Admin</p>
                  <p className="mt-2 font-semibold">superadmin</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-300">Admin</p>
                  <p className="mt-2 font-semibold">admin</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-300">Password</p>
                  <p className="mt-2 font-semibold">password123</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel flex items-center p-6 sm:p-8 lg:p-10">
          <div className="w-full">
            <div className="mb-6 inline-flex rounded-2xl bg-brand-100 p-3 text-brand-700">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold">Sign in</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Use your house account credentials to open the dashboard.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="field-label" htmlFor="username">
                  Username
                </label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter password"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-danger-100 bg-danger-100/60 px-4 py-3 text-sm font-medium text-danger-500">
                  {error}
                </div>
              ) : null}

              <Button className="w-full" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Signing in...' : 'Open Dashboard'}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
