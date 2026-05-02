import { Navigate, Outlet, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Spinner } from './components/ui/Spinner'
import { useAuth } from './providers/AuthProvider'
import { DashboardPage } from './pages/DashboardPage'
import { FinanceSummaryPage } from './pages/FinanceSummaryPage'
import { LoginPage } from './pages/LoginPage'
import { MealsPage } from './pages/MealsPage'
import { SettingsPage } from './pages/SettingsPage'
import type { Role } from './types'

function ProtectedRoute() {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading GAABAI KHAI..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate replace to="/login" />
  }

  return <AppShell><Outlet /></AppShell>
}

function GuestOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading..." />
      </div>
    )
  }

  if (user) {
    return <Navigate replace to="/" />
  }

  return <>{children}</>
}

function RoleRoute({ roles }: { roles: Role[] }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate replace to="/login" />
  }

  if (!roles.includes(user.role)) {
    return <Navigate replace to="/" />
  }

  return <Outlet />
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnlyRoute>
              <LoginPage />
            </GuestOnlyRoute>
          }
        />

        <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<DashboardPage />} />
          <Route path="meals" element={<MealsPage />} />
          <Route path="finance-summary" element={<FinanceSummaryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route element={<RoleRoute roles={['super_admin', 'admin']} />}>
            <Route path="groceries" element={<Navigate replace to="/settings?tab=groceries" />} />
            <Route path="users" element={<Navigate replace to="/settings?tab=members" />} />
            <Route path="meal-plans" element={<Navigate replace to="/settings?tab=meal-plans" />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </Router>
  )
}
