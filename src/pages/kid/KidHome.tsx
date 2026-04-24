import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { PointsBadge } from '../../components/shared/PointsBadge'
import { Modal } from '../../components/shared/Modal'
import { Confetti } from '../../components/shared/Confetti'
import { getLevelForPoints, LEVEL_THRESHOLDS, BADGE_DEFINITIONS, type MoodEmoji } from '../../types'
import { formatDate } from '../../utils/date'
import { LogOut, ChevronRight, Gift, Flame } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const MOODS: { emoji: MoodEmoji; label: string }[] = [
  { emoji: '😄', label: 'Great!' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😕', label: 'Not great' },
  { emoji: '😢', label: 'Rough day' },
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
  const pendingChores = todayInstances.filter(ci => ci.status === 'pending' || ci.status === 'submitted')
  const doneChores = todayInstances.filter(ci => ci.status === 'approved')
  const userBadges = badges.filter(b => b.userId === user.id)

  const recentActivity = ledger
    .filter(e => e.userId === user.id)
    .slice(-5)
    .reverse()

  const upcomingActivities = activities
    .filter(a => a.assignedTo.includes(user.id))
    .filter(a => new Date(a.start) >= new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 3)

  const lifetime = user.lifetimePoints ?? 0
  const currentLevel = getLevelForPoints(lifetime)
  const nextLevel = LEVEL_THRESHOLDS.find(l => l.minPoints > lifetime)
  const levelProgress = nextLevel
    ? ((lifetime - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100

  const pinnedPrize = pinnedPrizeId ? prizes.find(p => p.id === pinnedPrizeId) : null
  const pointsToGoal = pinnedPrize ? Math.max(0, pinnedPrize.cost - points) : 0
  const goalProgress = pinnedPrize ? Math.min(100, (points / pinnedPrize.cost) * 100) : 0

  const selectMood = (mood: MoodEmoji) => {
    logBehavior(user.id, mood)
    setMoodOpen(false)
    setConfetti(true)
    setTimeout(() => setConfetti(false), 3000)
  }

  return (
    <div className="min-h-screen pb-24 pt-safe">
      <Confetti trigger={confetti} />

      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{user.avatar}</span>
          <div>
            <h1 className="text-xl font-black">Hey, {user.name}! 👋</h1>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span>{currentLevel.name}</span>
              {(user.streak ?? 0) > 0 && (
                <span className="flex items-center gap-0.5 text-orange-500 font-bold">
                  <Flame className="w-3.5 h-3.5" /> {user.streak} day streak
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/') }} className="p-2 rounded-xl text-text-muted hover:opacity-70">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Points hero */}
      <div className="mx-4 my-3 rounded-3xl p-5 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${user.accentColor}cc, ${user.accentColor}66)` }}>
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-semibold mb-1">YOUR POINTS</p>
          <PointsBadge points={points} size="xl" />
          <div className="mt-3">
            <div className="flex justify-between text-white/70 text-xs mb-1">
              <span>{currentLevel.name}</span>
              <span>{nextLevel ? `${nextLevel.name} in ${nextLevel.minPoints - lifetime} pts` : 'Max Level!'}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mood check-in */}
      {!todayMood && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-3"
        >
          <button
            onClick={() => setMoodOpen(true)}
            className="card w-full p-4 flex items-center gap-3 hover:opacity-90"
            style={{ borderLeft: '4px solid #f59e0b' }}
          >
            <span className="text-2xl">😊</span>
            <div className="text-left">
              <p className="font-bold">How's your day?</p>
              <p className="text-text-muted text-sm">Tap to check in your mood</p>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted ml-auto" />
          </button>
        </motion.div>
      )}

      {todayMood && (
        <div className="mx-4 mb-3 card p-4 flex items-center gap-3">
          <span className="text-3xl">{todayMood.moodEmoji}</span>
          <div>
            <p className="font-semibold">Today's mood logged</p>
            <p className="text-text-muted text-sm">{MOODS.find(m => m.emoji === todayMood.moodEmoji)?.label}</p>
          </div>
        </div>
      )}

      {/* Today's chores */}
      <div className="mx-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-lg">Today's Chores</h2>
          <span className="text-text-muted text-sm">{doneChores.length}/{todayInstances.length} done</span>
        </div>
        {todayInstances.length === 0 ? (
          <div className="card p-4 text-center text-text-muted">
            <p className="text-2xl mb-1">🎉</p>
            <p>No chores today!</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {todayInstances.slice(0, 3).map(ci => {
              const chore = chores.find(c => c.id === ci.choreId)
              if (!chore) return null
              return (
                <div key={ci.id} className="card p-3 flex items-center gap-3">
                  <span className="text-2xl">{chore.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{chore.name}</p>
                    <p className="text-text-muted text-xs">+{chore.pointValue} pts</p>
                  </div>
                  <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                    ci.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    ci.status === 'submitted' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {ci.status === 'approved' ? '✓ Done' : ci.status === 'submitted' ? '⏳ Pending' : '○ Todo'}
                  </span>
                </div>
              )
            })}
            {todayInstances.length > 3 && (
              <button onClick={() => navigate('/kid/chores')} className="text-accent text-sm font-semibold text-center py-2">
                See all {todayInstances.length} chores →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Prize goal */}
      {pinnedPrize ? (
        <div className="mx-4 mb-3 card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold flex items-center gap-2">🎯 Goal: {pinnedPrize.emoji} {pinnedPrize.name}</p>
            <button onClick={() => setPinnedPrizeId(null)} className="text-text-muted text-xs">change</button>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goalProgress}%` }}
              transition={{ duration: 1 }}
              className="h-full rounded-full"
              style={{ backgroundColor: user.accentColor }}
            />
          </div>
          <p className="text-text-muted text-sm">
            {pointsToGoal === 0 ? '🎉 You can redeem this now!' : `${pointsToGoal} more points to go!`}
          </p>
        </div>
      ) : (
        <div className="mx-4 mb-3">
          <button
            onClick={() => setPrizePickerOpen(true)}
            className="card w-full p-4 flex items-center gap-3 hover:opacity-90"
          >
            <Gift className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            <div className="text-left">
              <p className="font-bold">Set a reward goal</p>
              <p className="text-text-muted text-sm">Pick a prize to save up for</p>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted ml-auto" />
          </button>
        </div>
      )}

      {/* Upcoming activities */}
      {upcomingActivities.length > 0 && (
        <div className="mx-4 mb-3">
          <h2 className="font-bold text-lg mb-2">Coming Up</h2>
          <div className="grid gap-2">
            {upcomingActivities.map(a => (
              <div key={a.id} className="card p-3 flex items-center gap-3">
                <span className="text-2xl">{a.emoji}</span>
                <div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-text-muted text-xs">
                    {formatDate(a.start.split('T')[0])} {a.start.includes('T') ? '· ' + format(parseISO(a.start), 'h:mm a') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="mx-4 mb-3">
          <h2 className="font-bold text-lg mb-2">Recent Activity</h2>
          <div className="card p-3 grid gap-2">
            {recentActivity.map(e => (
              <div key={e.id} className="flex items-center gap-2 text-sm">
                <span className={`font-bold ${e.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {e.amount > 0 ? '+' : ''}{e.amount}
                </span>
                <span className="text-text-muted flex-1">{e.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges preview */}
      {userBadges.length > 0 && (
        <div className="mx-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg">Badges</h2>
            <button onClick={() => navigate('/kid/badges')} className="text-accent text-sm">See all</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {userBadges.slice(0, 6).map(b => {
              const def = BADGE_DEFINITIONS[b.badgeKey]
              return def ? (
                <div key={b.id} className="card p-3 text-center flex-shrink-0 w-20">
                  <div className="text-2xl">{def.emoji}</div>
                  <div className="text-xs text-text-muted mt-1 truncate">{def.name}</div>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Mood modal */}
      <Modal open={moodOpen} onClose={() => setMoodOpen(false)} title="How's your day going?">
        <div className="grid grid-cols-5 gap-3 py-4">
          {MOODS.map(({ emoji, label }) => (
            <motion.button
              key={emoji}
              whileTap={{ scale: 0.9 }}
              onClick={() => selectMood(emoji)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="text-4xl">{emoji}</span>
              <span className="text-xs text-text-muted">{label}</span>
            </motion.button>
          ))}
        </div>
      </Modal>

      {/* Prize picker modal */}
      <Modal open={prizePickerOpen} onClose={() => setPrizePickerOpen(false)} title="Set a Goal">
        <div className="grid gap-3 py-2">
          {prizes.filter(p => p.active).map(p => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setPinnedPrizeId(p.id); setPrizePickerOpen(false) }}
              className="card p-4 flex items-center gap-3 text-left hover:opacity-90"
            >
              <span className="text-3xl">{p.emoji}</span>
              <div className="flex-1">
                <p className="font-bold">{p.name}</p>
                <PointsBadge points={p.cost} size="sm" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                points >= p.cost ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-500'
              }`}>
                {points >= p.cost ? 'Ready!' : `${Math.max(0, p.cost - points)} to go`}
              </span>
            </motion.button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
