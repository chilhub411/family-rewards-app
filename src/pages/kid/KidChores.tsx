import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { Modal } from '../../components/shared/Modal'
import { Confetti } from '../../components/shared/Confetti'
import { format, addDays, parseISO } from 'date-fns'

type TimeGroup = 'morning' | 'afternoon' | 'evening' | 'anytime'

const TIME_GROUPS: Record<TimeGroup, { label: string; emoji: string; color: string; hours: [number, number] }> = {
  morning:   { label: 'Morning',   emoji: '🌅', color: '#f59e0b', hours: [0, 12] },
  afternoon: { label: 'Afternoon', emoji: '☀️', color: '#f97316', hours: [12, 17] },
  evening:   { label: 'Evening',   emoji: '🌙', color: '#6366f1', hours: [17, 24] },
  anytime:   { label: 'Chores',    emoji: '✅', color: '#22c55e', hours: [-1, -1] },
}

function getTimeGroup(dueTime?: string): TimeGroup {
  if (!dueTime) return 'anytime'
  const hour = parseInt(dueTime.split(':')[0])
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

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
  const upcoming = Array.from({ length: 6 }, (_, i) => format(addDays(new Date(), i + 1), 'yyyy-MM-dd'))

  const todayInstances = choreInstances.filter(ci => ci.assignedTo === user.id && ci.dueDate === todayStr)
  const upcomingInstances = choreInstances.filter(ci => ci.assignedTo === user.id && upcoming.includes(ci.dueDate))

  const doneCount = todayInstances.filter(ci => ci.status === 'approved').length

  const handleSubmit = (instanceId: string) => {
    submitChore(instanceId, note || undefined)
    setSelected(null)
    setNote('')
    setConfetti(true)
    setTimeout(() => setConfetti(false), 3000)
  }

  // Group today's instances by time
  const grouped: Record<TimeGroup, typeof todayInstances> = {
    morning: [], afternoon: [], evening: [], anytime: []
  }
  todayInstances.forEach(ci => {
    const chore = chores.find(c => c.id === ci.choreId)
    grouped[getTimeGroup(chore?.dueTime)].push(ci)
  })

  const renderChoreRow = (ci: typeof todayInstances[0], accentColor?: string) => {
    const chore = chores.find(c => c.id === ci.choreId)
    if (!chore) return null
    const isDone = ci.status === 'approved'
    const isPending = ci.status === 'submitted'
    const color = accentColor ?? user?.accentColor ?? '#6366f1'

    return (
      <motion.button
        key={ci.id}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => !isDone && !isPending && setSelected(ci.id)}
        disabled={isDone || isPending}
        className="w-full flex items-center gap-3 p-3.5 text-left rounded-2xl transition-all"
        style={{ background: isDone ? color + '10' : 'var(--surface-raised)', border: `1px solid ${isDone ? color + '30' : 'var(--border)'}` }}
      >
        {/* Checkbox */}
        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all`}
          style={{
            background: isDone ? color : 'transparent',
            borderColor: isDone ? color : isPending ? '#f59e0b' : 'var(--text-muted)',
          }}>
          {isDone && <span className="text-white text-xs font-black">✓</span>}
          {isPending && <span className="text-xs">⏳</span>}
        </div>

        <span className="text-xl">{chore.emoji}</span>

        <div className="flex-1">
          <p className={`font-black text-sm ${isDone ? 'line-through' : ''}`}
            style={{ color: isDone ? 'var(--text-muted)' : 'var(--text-primary)' }}>
            {chore.name}
          </p>
          {isPending && (
            <p className="text-xs font-bold" style={{ color: '#f59e0b' }}>Waiting for approval</p>
          )}
        </div>

        {!isDone && !isPending && (
          <span className="text-sm font-black px-2.5 py-1 rounded-full"
            style={{ background: color + '15', color }}>
            +{chore.pointValue}
          </span>
        )}
      </motion.button>
    )
  }

  return (
    <div className="min-h-screen pb-28 pt-safe" style={{ background: 'var(--surface)' }}>
      <Confetti trigger={confetti} />

      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-2xl font-black mb-1">My Chores</h1>
        {tab === 'today' && todayInstances.length > 0 && (
          <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
            {doneCount} of {todayInstances.length} done today
          </p>
        )}
      </div>

      {/* Tab toggle */}
      <div className="px-5 mb-4">
        <div className="flex p-1 rounded-2xl gap-1" style={{ background: 'var(--surface-sunken)' }}>
          {(['today', 'upcoming'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-xl font-black text-sm transition-all"
              style={tab === t
                ? { background: 'var(--surface-raised)', color: 'var(--text-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                : { color: 'var(--text-muted)' }}>
              {t === 'today' ? '📅 Today' : '📆 Upcoming'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'today' && (
        <div className="px-5">
          {todayInstances.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-5xl mb-3">🎉</p>
              <p className="font-black text-lg">No chores today!</p>
              <p style={{ color: 'var(--text-muted)' }} className="text-sm">Enjoy your free day.</p>
            </div>
          ) : (
            <div className="grid gap-5">
              {(Object.entries(grouped) as [TimeGroup, typeof todayInstances][])
                .filter(([, items]) => items.length > 0)
                .map(([group, items]) => {
                  const g = TIME_GROUPS[group]
                  return (
                    <div key={group}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{g.emoji}</span>
                        <span className="section-title mb-0" style={{ color: g.color }}>{g.label}</span>
                      </div>
                      <div className="grid gap-2">
                        {items.map(ci => renderChoreRow(ci, g.color))}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {tab === 'upcoming' && (
        <div className="px-5 grid gap-5">
          {upcoming.map(date => {
            const dayItems = upcomingInstances.filter(ci => ci.dueDate === date)
            if (dayItems.length === 0) return null
            return (
              <div key={date}>
                <p className="section-title">{format(parseISO(date), 'EEEE, MMM d')}</p>
                <div className="grid gap-2">
                  {dayItems.map(ci => renderChoreRow(ci))}
                </div>
              </div>
            )
          })}
          {upcomingInstances.length === 0 && (
            <div className="card p-10 text-center">
              <p className="text-4xl mb-2">📭</p>
              <p style={{ color: 'var(--text-muted)' }}>No upcoming chores</p>
            </div>
          )}
        </div>
      )}

      {/* Mark done modal */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setNote('') }} title="Mark as Done">
        {selected && (() => {
          const ci = choreInstances.find(c => c.id === selected)
          const chore = chores.find(c => c.id === ci?.choreId)
          return chore ? (
            <div className="py-2">
              <div className="text-center mb-6 py-4 rounded-2xl"
                style={{ background: user.accentColor + '10' }}>
                <span className="text-6xl">{chore.emoji}</span>
                <p className="font-black text-xl mt-2">{chore.name}</p>
                <p className="font-black text-2xl mt-1" style={{ color: user.accentColor }}>+{chore.pointValue} pts</p>
                {chore.requiresApproval && (
                  <p className="text-xs font-bold mt-1" style={{ color: '#f59e0b' }}>⏳ Parent approval needed</p>
                )}
              </div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a note (optional)..."
                className="w-full p-3 rounded-xl text-sm mb-4 resize-none h-20"
                style={{ background: 'var(--surface-sunken)', border: 'none', outline: 'none', color: 'var(--text-primary)' }}
              />
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleSubmit(selected)}
                className="w-full py-4 rounded-2xl font-black text-white text-lg"
                style={{ background: user.accentColor }}>
                ✓ Done!
              </motion.button>
            </div>
          ) : null
        })()}
      </Modal>
    </div>
  )
}
