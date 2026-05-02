import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../api/client'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../providers/AuthProvider'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({
    username: '',
    password: '',
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
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-xl flex-col items-center justify-center">
        <section className="panel w-full p-6 sm:p-8 lg:p-10">
          <h1 className="text-3xl font-bold">GAABAI KHAI</h1>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="field-label" htmlFor="username">
                Username
              </label>
              <Input
                autoComplete="username"
                id="username"
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <Input
                autoComplete="current-password"
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-danger-100 bg-danger-100/60 px-4 py-3 text-sm font-medium text-danger-500">
                {error}
              </div>
            ) : null}

            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Signing in...' : 'Login'}
            </Button>
          </form>
        </section>

        <footer className="px-2 pt-8 text-center text-xs leading-6 text-stone-500 sm:px-4">
          <p>Developed by Ryan Hasan Sunny</p>
          <p>Inspired by Hasib Talukdar, MD Fahad Hossain, Jisan Hawladar</p>
        </footer>
      </div>
    </div>
  )
}
