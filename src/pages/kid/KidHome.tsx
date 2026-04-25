import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { Modal } from '../../components/shared/Modal'
import { Confetti } from '../../components/shared/Confetti'
import { BADGE_DEFINITIONS, getLevelForPoints, LEVEL_THRESHOLDS, type MoodEmoji } from '../../types'
import { formatDate } from '../../utils/date'
import { LogOut, Flame, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const MOODS: { emoji: MoodEmoji; label: string }[] = [
  { emoji: '😄', label: 'Great!' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😕', label: 'Meh' },
  { emoji: '😢', label: 'Rough' },
]

export function KidHome() {
  const navigate = useNavigate()
  const user = useAppStore(s => s.getCurrentUser())
  const logout = useAppStore(s => s.logout)
  const getUserPoints = useAppStore(s => s.getUserPoints)
  const getTodayInstances = useAppStore(s => s.getTodayInstances)
  const ledger = useAppStore(s => s.ledger)
  const prizes = useAppStore(s => s.prizes)
  const activities = useAppStore(s => s.activities)
  const chores = useAppStore(s => s.chores)
  const badges = useAppStore(s => s.badges)
  const logBehavior = useAppStore(s => s.logBehavior)
  const getTodayMood = useAppStore(s => s.getTodayMood)

  const [moodOpen, setMoodOpen] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [pinnedPrizeId, setPinnedPrizeId] = useState<string | null>(null)
  const [prizePickerOpen, setPrizePickerOpen] = useState(false)

  if (!user) return null

  const points = getUserPoints(user.id)
  const todayMood = getTodayMood(user.id)
  const todayInstances = getTodayInstances(user.id)
  const doneToday = todayInstances.filter(ci => ci.status === 'approved').length
  const totalToday = todayInstances.filter(ci => ci.status !== 'denied').length
  const pendingToday = todayInstances.filter(ci => ci.status === 'pending')

  const recentActivity = ledger.filter(e => e.userId === user.id).slice(-4).reverse()

  const upcomingActivities = activities
    .filter(a => a.assignedTo.includes(user.id) && new Date(a.start) >= new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 2)

  const lifetime = user.lifetimePoints ?? 0
  const currentLevel = getLevelForPoints(lifetime)
  const nextLevel = LEVEL_THRESHOLDS.find(l => l.minPoints > lifetime)
  const levelProgress = nextLevel
    ? ((lifetime - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100

  const pinnedPrize = pinnedPrizeId ? prizes.find(p => p.id === pinnedPrizeId) : null
  const goalProgress = pinnedPrize ? Math.min(100, (points / pinnedPrize.cost) * 100) : 0
  const pointsToGoal = pinnedPrize ? Math.max(0, pinnedPrize.cost - points) : 0

  const userBadges = badges.filter(b => b.userId === user.id)

  const selectMood = (mood: MoodEmoji) => {
    logBehavior(user.id, mood)
    setMoodOpen(false)
    setConfetti(true)
    setTimeout(() => setConfetti(false), 3000)
  }

  return (
    <div className="min-h-screen pb-28 pt-safe" style={{ background: 'var(--surface)' }}>
      <Confetti trigger={confetti} />

      {/* Header */}
      <div className="px-5 pt-5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: user.accentColor + '20' }}>
            {user.avatar}
          </div>
          <div>
            <h1 className="text-lg font-black">Hey, {user.name}! 👋</h1>
            <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
              <span>{currentLevel.name}</span>
              {(user.streak ?? 0) > 0 && (
                <span className="flex items-center gap-0.5" style={{ color: '#f97316' }}>
                  <Flame className="w-3 h-3" /> {user.streak}d streak
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/') }}
          className="w-9 h-9 card flex items-center justify-center"
          style={{ color: 'var(--text-muted)' }}>
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Points hero card */}
      <div className="mx-5 my-3 rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${user.accentColor}, ${user.accentColor}bb)` }}>
        <div className="relative z-10">
          <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-1">Your Points</p>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-5xl font-black">{points.toLocaleString()}</span>
            <span className="text-white/60 text-lg mb-1">pts</span>
          </div>
          <div>
            <div className="flex justify-between text-white/70 text-xs font-bold mb-1.5">
              <span>{currentLevel.name}</span>
              <span>{nextLevel ? `${nextLevel.minPoints - lifetime} to ${nextLevel.name}` : '🏆 Max Level'}</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full rounded-full bg-white"
              />
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20"
          style={{ background: 'white' }} />
        <div className="absolute -right-4 -bottom-12 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'white' }} />
      </div>

      {/* Mood check-in */}
      {!todayMood ? (
        <motion.button
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMoodOpen(true)}
          className="card mx-5 mb-3 p-4 flex items-center gap-3 w-[calc(100%-40px)]"
          style={{ borderLeft: `4px solid #f59e0b` }}>
          <span className="text-2xl">😊</span>
          <div className="flex-1 text-left">
            <p className="font-black text-sm">Check in your mood</p>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>How's your day going?</p>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        </motion.button>
      ) : (
        <div className="card mx-5 mb-3 p-3 flex items-center gap-3">
          <span className="text-2xl">{todayMood.moodEmoji}</span>
          <p className="font-bold text-sm">{MOODS.find(m => m.emoji === todayMood.moodEmoji)?.label} — mood logged</p>
        </div>
      )}

      {/* Today's chores */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="section-title" style={{ marginBottom: 0 }}>Today's Chores</p>
          <span className="text-xs font-black" style={{ color: doneToday === totalToday && totalToday > 0 ? '#22c55e' : 'var(--text-muted)' }}>
            {doneToday}/{totalToday} done
          </span>
        </div>

        {totalToday === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-3xl mb-1">🎉</p>
            <p className="font-black">No chores today!</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Progress bar at top */}
            <div className="h-1.5" style={{ background: 'var(--surface-sunken)' }}>
              <div className="h-full transition-all duration-700"
                style={{ width: `${totalToday > 0 ? (doneToday / totalToday) * 100 : 0}%`, background: user.accentColor }} />
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {todayInstances.slice(0, 4).map(ci => {
                const chore = chores.find(c => c.id === ci.choreId)
                if (!chore) return null
                const isDone = ci.status === 'approved'
                const isPending = ci.status === 'submitted'
                return (
                  <button key={ci.id}
                    onClick={() => navigate('/kid/chores')}
                    className="w-full flex items-center gap-3 p-3.5 text-left hover:opacity-80 transition-opacity">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 transition-all ${isDone ? 'border-transparent' : 'border-current'}`}
                      style={{ background: isDone ? user.accentColor : 'transparent', color: isDone ? 'white' : 'var(--text-muted)', borderColor: isDone ? user.accentColor : undefined }}>
                      {isDone ? '✓' : chore.emoji}
                    </div>
                    <span className={`flex-1 font-bold text-sm ${isDone ? 'line-through' : ''}`}
                      style={{ color: isDone ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {chore.name}
                    </span>
                    {isPending
                      ? <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: '#f59e0b20', color: '#f59e0b' }}>Pending</span>
                      : !isDone && <span className="text-xs font-black" style={{ color: user.accentColor }}>+{chore.pointValue}</span>
                    }
                  </button>
                )
              })}
              {todayInstances.length > 4 && (
                <button onClick={() => navigate('/kid/chores')}
                  className="w-full text-center py-3 text-sm font-black"
                  style={{ color: user.accentColor }}>
                  See all {todayInstances.length} chores →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reward goal */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="section-title" style={{ marginBottom: 0 }}>Reward Goal</p>
          <button onClick={() => setPrizePickerOpen(true)}
            className="text-xs font-black" style={{ color: user.accentColor }}>
            {pinnedPrize ? 'Change' : 'Set Goal'}
          </button>
        </div>

        {pinnedPrize ? (
          <div className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{pinnedPrize.emoji}</span>
              <div className="flex-1">
                <p className="font-black">{pinnedPrize.name}</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                  {pointsToGoal === 0 ? '🎉 Ready to redeem!' : `${pointsToGoal} more points to go`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black" style={{ color: user.accentColor }}>{points}</p>
                <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>/ {pinnedPrize.cost}</p>
              </div>
            </div>
            <div className="progress-bar">
              <motion.div className="progress-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${goalProgress}%` }}
                transition={{ duration: 1 }}
                style={{ background: user.accentColor }} />
            </div>
          </div>
        ) : (
          <button onClick={() => setPrizePickerOpen(true)}
            className="card w-full p-5 text-center hover:shadow-md transition-shadow"
            style={{ borderStyle: 'dashed', borderWidth: 2, borderColor: user.accentColor + '40', background: user.accentColor + '08' }}>
            <p className="text-2xl mb-1">🎯</p>
            <p className="font-black text-sm" style={{ color: user.accentColor }}>Pick a reward to save up for</p>
          </button>
        )}
      </div>

      {/* Upcoming */}
      {upcomingActivities.length > 0 && (
        <div className="px-5 mb-4">
          <p className="section-title">Coming Up</p>
          <div className="grid gap-2">
            {upcomingActivities.map(a => (
              <div key={a.id} className="card p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: user.accentColor + '15' }}>
                  {a.emoji}
                </div>
                <div>
                  <p className="font-black text-sm">{a.title}</p>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(a.start.split('T')[0])}
                    {a.start.includes('T') ? ' · ' + format(parseISO(a.start), 'h:mm a') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="px-5 mb-4">
          <p className="section-title">Recent Activity</p>
          <div className="card divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentActivity.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-3.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${e.amount > 0 ? 'text-green-600' : 'text-red-500'}`}
                  style={{ background: e.amount > 0 ? '#22c55e20' : '#ef444420' }}>
                  {e.amount > 0 ? '+' : ''}{e.amount}
                </div>
                <p className="text-sm font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>{e.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges row */}
      {userBadges.length > 0 && (
        <div className="px-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="section-title" style={{ marginBottom: 0 }}>Badges</p>
            <button onClick={() => navigate('/kid/badges')} className="text-xs font-black" style={{ color: user.accentColor }}>See all</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {userBadges.slice(0, 6).map(b => {
              const def = BADGE_DEFINITIONS[b.badgeKey]
              return def ? (
                <div key={b.id} className="card p-3 text-center flex-shrink-0 w-20">
                  <div className="text-2xl">{def.emoji}</div>
                  <div className="text-xs font-bold mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{def.name}</div>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Mood modal */}
      <Modal open={moodOpen} onClose={() => setMoodOpen(false)} title="How's your day?">
        <div className="grid grid-cols-5 gap-2 py-4">
          {MOODS.map(({ emoji, label }) => (
            <motion.button key={emoji} whileTap={{ scale: 0.9 }}
              onClick={() => selectMood(emoji)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:opacity-80"
              style={{ background: 'var(--surface-sunken)' }}>
              <span className="text-4xl">{emoji}</span>
              <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{label}</span>
            </motion.button>
          ))}
        </div>
      </Modal>

      {/* Prize picker */}
      <Modal open={prizePickerOpen} onClose={() => setPrizePickerOpen(false)} title="Set a Reward Goal">
        <div className="grid gap-2 py-2">
          {prizes.filter(p => p.active).map(p => {
            const progress = Math.min(100, (points / p.cost) * 100)
            const canAfford = points >= p.cost
            return (
              <motion.button key={p.id} whileTap={{ scale: 0.98 }}
                onClick={() => { setPinnedPrizeId(p.id); setPrizePickerOpen(false) }}
                className={`card p-4 text-left ${pinnedPrizeId === p.id ? 'ring-2' : ''}`}
                style={pinnedPrizeId === p.id ? { outline: `2px solid ${user.accentColor}` } : {}}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{p.emoji}</span>
                  <div className="flex-1">
                    <p className="font-black">{p.name}</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                      {canAfford ? '✅ Ready!' : `${p.cost - points} pts to go`}
                    </p>
                  </div>
                  <p className="font-black text-lg" style={{ color: user.accentColor }}>⭐ {p.cost}</p>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%`, background: user.accentColor }} />
                </div>
              </motion.button>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}
