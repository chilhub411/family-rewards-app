import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { PointsBadge } from '../../components/shared/PointsBadge'
import { Modal } from '../../components/shared/Modal'
import { LogOut, Bell, Zap, Plus, Minus } from 'lucide-react'

export function ParentHome() {
  const navigate = useNavigate()
  const user = useAppStore(s => s.getCurrentUser())
  const users = useAppStore(s => s.users.filter(u => !u.archived && u.role === 'kid'))
  const logout = useAppStore(s => s.logout)
  const getUserPoints = useAppStore(s => s.getUserPoints)
  const addPoints = useAppStore(s => s.addPoints)
  const choreInstances = useAppStore(s => s.choreInstances)
  const redemptions = useAppStore(s => s.redemptions)
  const transfers = useAppStore(s => s.transfers)

  const [quickActionKid, setQuickActionKid] = useState<string | null>(null)
  const [quickReason, setQuickReason] = useState('')
  const [quickAmount, setQuickAmount] = useState(10)
  const [isDeduct, setIsDeduct] = useState(false)

  if (!user) return null

  const today = new Date().toISOString().split('T')[0]
  const todayInstances = choreInstances.filter(ci => ci.dueDate === today)
  const pendingApprovals = [
    ...choreInstances.filter(ci => ci.status === 'submitted'),
    ...redemptions.filter(r => r.status === 'pending'),
    ...transfers.filter(t => t.status === 'pending'),
  ].length

  const choresCompleted = todayInstances.filter(ci => ci.status === 'approved').length
  const choresTotal = todayInstances.filter(ci => ci.status !== 'denied').length

  const QUICK_AMOUNTS = [5, 10, 15, 20, 50]
  const QUICK_REASONS_POSITIVE = ['Being helpful', 'Great attitude', 'Went above & beyond', 'Being kind to sibling', 'Extra chore']
  const QUICK_REASONS_NEGATIVE = ['Bad attitude', 'Didn\'t listen', 'Fighting with sibling', 'Broke a rule']

  const applyQuickAction = () => {
    if (!quickActionKid || !quickReason || !user) return
    addPoints(quickActionKid, isDeduct ? -quickAmount : quickAmount, quickReason, 'manual', user.id)
    setQuickActionKid(null)
    setQuickReason('')
    setQuickAmount(10)
    setIsDeduct(false)
  }

  return (
    <div className="min-h-screen pb-24 pt-safe">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Family Dashboard</h1>
          <p className="text-text-muted text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingApprovals > 0 && (
            <button
              onClick={() => navigate('/parent/approvals')}
              className="relative p-2 rounded-xl card"
            >
              <Bell className="w-5 h-5 text-amber-500" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {pendingApprovals}
              </span>
            </button>
          )}
          <button onClick={() => { logout(); navigate('/') }} className="p-2 rounded-xl text-text-muted hover:opacity-70">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Family overview */}
      <div className="px-4 mb-4">
        <div className="grid gap-3">
          {users.map(kid => {
            const pts = getUserPoints(kid.id)
            const kidInstances = todayInstances.filter(ci => ci.assignedTo === kid.id)
            const kidDone = kidInstances.filter(ci => ci.status === 'approved').length
            const kidTotal = kidInstances.filter(ci => ci.status !== 'denied').length

            return (
              <motion.div
                key={kid.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4"
                style={{ borderLeft: `4px solid ${kid.accentColor}` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{kid.avatar}</span>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{kid.name}</p>
                    <PointsBadge points={pts} size="sm" />
                  </div>
                  <button
                    onClick={() => { setQuickActionKid(kid.id); setIsDeduct(false) }}
                    className="p-2 rounded-xl hover:opacity-70"
                    style={{ color: kid.accentColor }}
                  >
                    <Zap className="w-5 h-5" />
                  </button>
                </div>
                {kidTotal > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>Today's chores</span>
                      <span>{kidDone}/{kidTotal}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${kidTotal > 0 ? (kidDone / kidTotal) * 100 : 0}%`, backgroundColor: kid.accentColor }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 mb-4 grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="text-3xl font-black" style={{ color: 'var(--accent)' }}>
            {choresCompleted}/{choresTotal}
          </p>
          <p className="text-text-muted text-sm">Chores Today</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-black text-amber-500">{pendingApprovals}</p>
          <p className="text-text-muted text-sm">Pending Approvals</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 mb-4">
        <h2 className="font-bold text-lg mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '+ Points', icon: Plus, action: () => { if (users[0]) setQuickActionKid(users[0].id) }, color: 'text-green-500' },
            { label: '− Points', icon: Minus, action: () => { if (users[0]) { setQuickActionKid(users[0].id); setIsDeduct(true) } }, color: 'text-red-500' },
            { label: 'Approvals', icon: Bell, action: () => navigate('/parent/approvals'), color: 'text-amber-500' },
            { label: 'Manage', icon: Zap, action: () => navigate('/parent/manage'), color: 'var(--accent)' },
          ].map(({ label, icon: Icon, action, color }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.97 }}
              onClick={action}
              className="card p-4 flex flex-col items-center gap-2 hover:opacity-90"
            >
              <Icon className={`w-6 h-6 ${color}`} style={color.startsWith('#') || color.startsWith('var') ? { color } : {}} />
              <span className="font-semibold text-sm">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Quick action modal */}
      <Modal
        open={!!quickActionKid}
        onClose={() => { setQuickActionKid(null); setIsDeduct(false) }}
        title={isDeduct ? '− Deduct Points' : '+ Add Points'}
      >
        {quickActionKid && (
          <div className="py-2 grid gap-4">
            {/* Kid selector */}
            <div className="flex gap-2">
              {users.map(kid => (
                <button
                  key={kid.id}
                  onClick={() => setQuickActionKid(kid.id)}
                  className={`flex-1 card p-3 flex flex-col items-center gap-1 ${quickActionKid === kid.id ? 'ring-2' : ''}`}
                  style={quickActionKid === kid.id ? { outline: `2px solid ${kid.accentColor}` } : {}}
                >
                  <span className="text-2xl">{kid.avatar}</span>
                  <span className="text-xs font-bold">{kid.name}</span>
                </button>
              ))}
            </div>

            {/* +/- toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsDeduct(false)}
                className={`flex-1 py-2 rounded-xl font-bold transition-all ${!isDeduct ? 'bg-green-500 text-white' : 'card text-text-muted'}`}
              >
                + Add
              </button>
              <button
                onClick={() => setIsDeduct(true)}
                className={`flex-1 py-2 rounded-xl font-bold transition-all ${isDeduct ? 'bg-red-500 text-white' : 'card text-text-muted'}`}
              >
                − Deduct
              </button>
            </div>

            {/* Amount */}
            <div>
              <p className="font-semibold text-sm mb-2 text-text-muted">Amount</p>
              <div className="flex gap-2">
                {QUICK_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => setQuickAmount(a)}
                    className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${
                      quickAmount === a ? 'text-white' : 'card text-text-muted'
                    }`}
                    style={quickAmount === a ? { backgroundColor: 'var(--accent)' } : {}}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="font-semibold text-sm mb-2 text-text-muted">Reason (required)</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {(isDeduct ? QUICK_REASONS_NEGATIVE : QUICK_REASONS_POSITIVE).map(r => (
                  <button
                    key={r}
                    onClick={() => setQuickReason(r)}
                    className={`text-sm px-3 py-1.5 rounded-xl ${quickReason === r ? 'text-white' : 'card text-text-muted'}`}
                    style={quickReason === r ? { backgroundColor: 'var(--accent)' } : {}}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <input
                value={quickReason}
                onChange={e => setQuickReason(e.target.value)}
                placeholder="Or type a custom reason..."
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={applyQuickAction}
              disabled={!quickReason}
              className="w-full py-4 rounded-2xl font-bold text-white text-lg disabled:opacity-40"
              style={{ backgroundColor: isDeduct ? '#ef4444' : '#22c55e' }}
            >
              {isDeduct ? `− ${quickAmount} points` : `+ ${quickAmount} points`}
            </motion.button>
          </div>
        )}
      </Modal>
    </div>
  )
}
