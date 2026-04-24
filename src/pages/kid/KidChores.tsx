import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { Modal } from '../../components/shared/Modal'
import { Confetti } from '../../components/shared/Confetti'
import { CheckCircle, Circle, Clock, XCircle } from 'lucide-react'
import { format, parseISO, addDays } from 'date-fns'

export function KidChores() {
  const user = useAppStore(s => s.getCurrentUser())
  const chores = useAppStore(s => s.chores)
  const choreInstances = useAppStore(s => s.choreInstances)
  const submitChore = useAppStore(s => s.submitChore)

  const [selected, setSelected] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [confetti, setConfetti] = useState(false)
  const [tab, setTab] = useState<'today' | 'upcoming'>('today')

  if (!user) return null

  const todayStr = new Date().toISOString().split('T')[0]
  const upcoming: string[] = []
  for (let i = 1; i <= 6; i++) {
    upcoming.push(format(addDays(new Date(), i), 'yyyy-MM-dd'))
  }

  const todayInstances = choreInstances.filter(
    ci => ci.assignedTo === user.id && ci.dueDate === todayStr
  )
  const upcomingInstances = choreInstances.filter(
    ci => ci.assignedTo === user.id && upcoming.includes(ci.dueDate)
  )

  const handleSubmit = (instanceId: string) => {
    submitChore(instanceId, note || undefined)
    setSelected(null)
    setNote('')
    setConfetti(true)
    setTimeout(() => setConfetti(false), 3000)
  }

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="w-5 h-5 text-green-500" />
    if (status === 'submitted') return <Clock className="w-5 h-5 text-amber-500" />
    if (status === 'denied') return <XCircle className="w-5 h-5 text-red-500" />
    return <Circle className="w-5 h-5 text-text-muted" />
  }

  const renderInstance = (ci: typeof choreInstances[0]) => {
    const chore = chores.find(c => c.id === ci.choreId)
    if (!chore) return null
    const canSubmit = ci.status === 'pending'

    return (
      <motion.div
        key={ci.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card p-4 flex items-center gap-3 ${canSubmit ? 'cursor-pointer hover:opacity-90' : ''}`}
        onClick={() => canSubmit && setSelected(ci.id)}
      >
        <span className="text-3xl">{chore.emoji}</span>
        <div className="flex-1">
          <p className="font-bold">{chore.name}</p>
          <p className="text-text-muted text-xs">
            +{chore.pointValue} pts
            {chore.requiresApproval && ' · needs approval'}
          </p>
        </div>
        {statusIcon(ci.status)}
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen pb-24 pt-safe px-4">
      <Confetti trigger={confetti} />

      <div className="pt-4 mb-4">
        <h1 className="text-2xl font-black mb-3">My Chores</h1>

        <div className="flex gap-2">
          {(['today', 'upcoming'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                tab === t ? 'text-white' : 'card text-text-muted'
              }`}
              style={tab === t ? { backgroundColor: 'var(--accent)' } : {}}
            >
              {t === 'today' ? '📅 Today' : '📆 Upcoming'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'today' && (
        <div className="grid gap-3">
          {todayInstances.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-4xl mb-2">🎉</p>
              <p className="font-bold text-lg">No chores today!</p>
              <p className="text-text-muted">Enjoy your day.</p>
            </div>
          ) : (
            todayInstances.map(renderInstance)
          )}
        </div>
      )}

      {tab === 'upcoming' && (
        <div>
          {upcoming.map(date => {
            const dayInstances = upcomingInstances.filter(ci => ci.dueDate === date)
            if (dayInstances.length === 0) return null
            return (
              <div key={date} className="mb-4">
                <p className="font-semibold text-text-muted text-sm mb-2">
                  {format(parseISO(date), 'EEEE, MMM d')}
                </p>
                <div className="grid gap-2">
                  {dayInstances.map(renderInstance)}
                </div>
              </div>
            )
          })}
          {upcomingInstances.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-text-muted">No upcoming chores scheduled</p>
            </div>
          )}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => { setSelected(null); setNote('') }}
        title="Mark as Done"
      >
        {selected && (() => {
          const ci = choreInstances.find(c => c.id === selected)
          const chore = chores.find(c => c.id === ci?.choreId)
          return chore ? (
            <div className="py-2">
              <div className="text-center mb-6">
                <span className="text-5xl">{chore.emoji}</span>
                <p className="font-bold text-xl mt-2">{chore.name}</p>
                <p className="text-text-muted">+{chore.pointValue} points</p>
                {chore.requiresApproval && (
                  <p className="text-amber-500 text-sm mt-1">⏳ Parent approval needed</p>
                )}
              </div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a note (optional)..."
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm mb-4 resize-none h-20"
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSubmit(selected)}
                className="w-full py-4 rounded-2xl font-bold text-white text-lg"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                ✓ Mark as Done!
              </motion.button>
            </div>
          ) : null
        })()}
      </Modal>
    </div>
  )
}
