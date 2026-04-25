import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { Modal } from '../../components/shared/Modal'
import { LogOut, Bell, Plus, Minus } from 'lucide-react'

export function ParentHome() {
  const navigate = useNavigate()
  const user = useAppStore(s => s.getCurrentUser())
  const kids = useAppStore(s => s.users.filter(u => !u.archived && u.role === 'kid'))
  const logout = useAppStore(s => s.logout)
  const getUserPoints = useAppStore(s => s.getUserPoints)
  const addPoints = useAppStore(s => s.addPoints)
  const choreInstances = useAppStore(s => s.choreInstances)
  const chores = useAppStore(s => s.chores)
  const redemptions = useAppStore(s => s.redemptions)
  const transfers = useAppStore(s => s.transfers)

  const [quickKid, setQuickKid] = useState<string | null>(null)
  const [quickReason, setQuickReason] = useState('')
  const [quickAmount, setQuickAmount] = useState(10)
  const [isDeduct, setIsDeduct] = useState(false)

  if (!user) return null

  const today = new Date().toISOString().split('T')[0]
  const todayInstances = choreInstances.filter(ci => ci.dueDate === today)

  const pendingCount =
    choreInstances.filter(ci => ci.status === 'submitted').length +
    redemptions.filter(r => r.status === 'pending').length +
    transfers.filter(t => t.status === 'pending').length

  const QUICK_AMOUNTS = [5, 10, 15, 20, 50]
  const QUICK_REASONS_POS = ['Being helpful', 'Great attitude', 'Above & beyond', 'Kind to sibling', 'Extra chore']
  const QUICK_REASONS_NEG = ['Bad attitude', 'Didn\'t listen', 'Fighting', 'Broke a rule']

  const applyQuick = () => {
    if (!quickKid || !quickReason || !user) return
    addPoints(quickKid, isDeduct ? -quickAmount : quickAmount, quickReason, 'manual', user.id)
    setQuickKid(null); setQuickReason(''); setQuickAmount(10); setIsDeduct(false)
  }

  return (
    <div className="min-h-screen pb-28 pt-safe" style={{ background: 'var(--surface)' }}>

      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-black mt-0.5">Family Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button onClick={() => navigate('/parent/approvals')}
              className="relative w-10 h-10 card flex items-center justify-center">
              <Bell className="w-5 h-5" style={{ color: '#f59e0b' }} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-black">
                {pendingCount}
              </span>
            </button>
          )}
          <button onClick={() => { logout(); navigate('/') }}
            className="w-10 h-10 card flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}>
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Kids columns */}
      <div className="px-5 mb-5">
        <div className={`grid gap-3 ${kids.length === 1 ? 'grid-cols-1' : kids.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {kids.map((kid, i) => {
            const pts = getUserPoints(kid.id)
            const kidInstances = todayInstances.filter(ci => ci.assignedTo === kid.id)
            const done = kidInstances.filter(ci => ci.status === 'approved').length
            const total = kidInstances.filter(ci => ci.status !== 'denied').length
            const remaining = kidInstances.filter(ci => ci.status === 'pending')

            return (
              <motion.div
                key={kid.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="card p-4"
              >
                {/* Kid header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: kid.accentColor + '20' }}>
                    {kid.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black truncate">{kid.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-black" style={{ color: kid.accentColor }}>⭐ {pts}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>pts</span>
                    </div>
                  </div>
                </div>

                {/* Chore progress */}
                {total > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      <span>Chores</span>
                      <span>{done}/{total}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill"
                        style={{ width: `${total > 0 ? (done / total) * 100 : 0}%`, background: kid.accentColor }} />
                    </div>
                  </div>
                )}

                {/* Pending chores */}
                <div className="grid gap-1.5 mb-3">
                  {remaining.slice(0, 3).map(ci => {
                    const chore = chores.find(c => c.id === ci.choreId)
                    if (!chore) return null
                    return (
                      <div key={ci.id} className="flex items-center gap-2 py-1.5 px-2 rounded-xl"
                        style={{ background: 'var(--surface-sunken)' }}>
                        <span className="text-base">{chore.emoji}</span>
                        <span className="text-xs font-semibold flex-1 truncate">{chore.name}</span>
                        <span className="text-xs font-bold" style={{ color: kid.accentColor }}>+{chore.pointValue}</span>
                      </div>
                    )
                  })}
                  {remaining.length === 0 && total > 0 && (
                    <div className="text-center py-2 text-2xl">🎉</div>
                  )}
                </div>

                {/* Quick action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setQuickKid(kid.id); setIsDeduct(false) }}
                    className="flex-1 py-2 rounded-xl text-sm font-black text-white flex items-center justify-center gap-1"
                    style={{ background: kid.accentColor }}>
                    <Plus className="w-3.5 h-3.5" /> Pts
                  </button>
                  <button
                    onClick={() => { setQuickKid(kid.id); setIsDeduct(true) }}
                    className="py-2 px-3 rounded-xl text-sm font-black"
                    style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}>
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Summary row */}
      <div className="px-5 grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Chores Done', value: `${todayInstances.filter(ci => ci.status === 'approved').length}/${todayInstances.filter(ci => ci.status !== 'denied').length}`, color: '#22c55e' },
          { label: 'Pending', value: pendingCount, color: '#f59e0b', action: () => navigate('/parent/approvals') },
          { label: 'Kids', value: kids.length, color: '#6366f1' },
        ].map(s => (
          <button key={s.label} onClick={s.action}
            className="card p-3 text-center">
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Quick action modal */}
      <Modal open={!!quickKid} onClose={() => { setQuickKid(null); setIsDeduct(false) }}
        title={isDeduct ? '− Remove Points' : '+ Add Points'}>
        {quickKid && (
          <div className="grid gap-4 py-2">
            {/* Kid selector */}
            <div className="flex gap-2">
              {kids.map(k => (
                <button key={k.id} onClick={() => setQuickKid(k.id)}
                  className="flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all"
                  style={quickKid === k.id
                    ? { background: k.accentColor + '20', outline: `2px solid ${k.accentColor}` }
                    : { background: 'var(--surface-sunken)' }}>
                  <span className="text-2xl">{k.avatar}</span>
                  <span className="text-xs font-black">{k.name}</span>
                </button>
              ))}
            </div>

            {/* +/- */}
            <div className="flex gap-2">
              {[false, true].map(d => (
                <button key={String(d)} onClick={() => setIsDeduct(d)}
                  className="flex-1 py-2.5 rounded-xl font-black transition-all"
                  style={isDeduct === d
                    ? { background: d ? '#ef4444' : '#22c55e', color: 'white' }
                    : { background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}>
                  {d ? '− Remove' : '+ Add'}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <p className="section-title">Amount</p>
              <div className="flex gap-2">
                {QUICK_AMOUNTS.map(a => (
                  <button key={a} onClick={() => setQuickAmount(a)}
                    className="flex-1 py-2.5 rounded-xl font-black text-sm transition-all"
                    style={quickAmount === a
                      ? { background: 'var(--accent)', color: 'white' }
                      : { background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="section-title">Reason</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {(isDeduct ? QUICK_REASONS_NEG : QUICK_REASONS_POS).map(r => (
                  <button key={r} onClick={() => setQuickReason(r)}
                    className="text-sm px-3 py-1.5 rounded-xl font-semibold transition-all"
                    style={quickReason === r
                      ? { background: 'var(--accent)', color: 'white' }
                      : { background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}>
                    {r}
                  </button>
                ))}
              </div>
              <input value={quickReason} onChange={e => setQuickReason(e.target.value)}
                placeholder="Custom reason..."
                className="w-full p-3 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--surface-sunken)', color: 'var(--text-primary)', border: 'none', outline: 'none' }} />
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={applyQuick}
              disabled={!quickReason}
              className="w-full py-4 rounded-2xl font-black text-white text-lg disabled:opacity-30"
              style={{ background: isDeduct ? '#ef4444' : '#22c55e' }}>
              {isDeduct ? `− ${quickAmount} points` : `+ ${quickAmount} points`}
            </motion.button>
          </div>
        )}
      </Modal>
    </div>
  )
}
