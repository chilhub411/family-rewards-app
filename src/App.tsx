import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './stores/appStore'
import { useTheme } from './hooks/useTheme'
import { BottomNav } from './components/shared/BottomNav'

import { LoginPage } from './pages/LoginPage'
import { SetupWizard } from './pages/SetupWizard'
import { WallDisplay } from './pages/WallDisplay'

import { KidHome } from './pages/kid/KidHome'
import { KidChores } from './pages/kid/KidChores'
import { KidPrizes } from './pages/kid/KidPrizes'
import { KidCalendar } from './pages/kid/KidCalendar'
import { KidBadges } from './pages/kid/KidBadges'

import { ParentHome } from './pages/parent/ParentHome'
import { ParentApprovals } from './pages/parent/ParentApprovals'
import { ParentManage } from './pages/parent/ParentManage'
import { ParentReports } from './pages/parent/ParentReports'

function RequireAuth({ role, children }: { role: 'kid' | 'parent'; children: React.ReactNode }) {
  const user = useAppStore(s => s.getCurrentUser())
  if (!user) return <Navigate to="/" replace />
  if (user.role !== role) return <Navigate to={user.role === 'parent' ? '/parent' : '/kid'} replace />
  return <>{children}</>
}

function KidLayout() {
  return (
    <>
      <KidHome />
      <BottomNav role="kid" />
    </>
  )
}

export default function App() {
  useTheme()
  const setupComplete = useAppStore(s => s.setupComplete)
  const currentUser = useAppStore(s => s.getCurrentUser())

  return (
    <Routes>
      <Route path="/setup" element={<SetupWizard />} />
      <Route path="/wall" element={<WallDisplay />} />

      <Route path="/" element={
        !setupComplete ? <Navigate to="/setup" replace /> :
        currentUser ? <Navigate to={currentUser.role === 'parent' ? '/parent' : '/kid'} replace /> :
        <LoginPage />
      } />

      {/* Kid routes */}
      <Route path="/kid" element={
        <RequireAuth role="kid">
          <div className="relative">
            <KidHome />
            <BottomNav role="kid" />
          </div>
        </RequireAuth>
      } />
      <Route path="/kid/chores" element={
        <RequireAuth role="kid">
          <div className="relative">
            <KidChores />
            <BottomNav role="kid" />
          </div>
        </RequireAuth>
      } />
      <Route path="/kid/prizes" element={
        <RequireAuth role="kid">
          <div className="relative">
            <KidPrizes />
            <BottomNav role="kid" />
          </div>
        </RequireAuth>
      } />
      <Route path="/kid/calendar" element={
        <RequireAuth role="kid">
          <div className="relative">
            <KidCalendar />
            <BottomNav role="kid" />
          </div>
        </RequireAuth>
      } />
      <Route path="/kid/badges" element={
        <RequireAuth role="kid">
          <div className="relative">
            <KidBadges />
            <BottomNav role="kid" />
          </div>
        </RequireAuth>
      } />

      {/* Parent routes */}
      <Route path="/parent" element={
        <RequireAuth role="parent">
          <div className="relative">
            <ParentHome />
            <BottomNav role="parent" />
          </div>
        </RequireAuth>
      } />
      <Route path="/parent/approvals" element={
        <RequireAuth role="parent">
          <div className="relative">
            <ParentApprovals />
            <BottomNav role="parent" />
          </div>
        </RequireAuth>
      } />
      <Route path="/parent/manage" element={
        <RequireAuth role="parent">
          <div className="relative">
            <ParentManage />
            <BottomNav role="parent" />
          </div>
        </RequireAuth>
      } />
      <Route path="/parent/reports" element={
        <RequireAuth role="parent">
          <div className="relative">
            <ParentReports />
            <BottomNav role="parent" />
          </div>
        </RequireAuth>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
