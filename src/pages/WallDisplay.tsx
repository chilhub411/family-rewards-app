import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../stores/appStore'
import { PointsBadge } from '../components/shared/PointsBadge'
import { BADGE_DEFINITIONS } from '../types'
import { format, parseISO } from 'date-fns'

export function WallDisplay() {
  const navigate = useNavigate()
  const users = useAppStore(s => s.users.filter(u => u.role === 'kid' && !u.archived))
  const choreInstances = useAppStore(s => s.choreInstances)
  const chores = useAppStore(s => s.chores)
  const activities = useAppStore(s => s.activities)
  const getUserPoints = useAppStore(s => s.getUserPoints)
  const badges = useAppStore(s => s.badges)
  const generateChoreInstances = useAppStore(s => s.generateChoreInstances)
  const settings = useAppStore(s => s.settings)

  const [time, setTime] = useState(new Date())
  const [sleeping, setSleeping] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [spotlight, setSpotlight] = useState(0)

  useEffect(() => {
    document.documentElement.classList.add('dark')
    return () => document.documentElement.classList.remove('dark')
  }, [])

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const refresh = setInterval(() => {
      generateChoreInstances()
    }, settings.wallAutoRefreshSeconds * 1000)
    return () => clearInterval(refresh)
  }, [settings.wallAutoRefreshSeconds])

  useEffect(() => {
    const sleep = setInterval(() => {
      if (Date.now() - lastActivity > settings.wallSleepAfterMinutes * 60 * 1000) {
        setSleeping(true)
      }
    }, 10000)
    return () => clearInterval(sleep)
  }, [lastActivity, settings.wallSleepAfterMinutes])

  useEffect(() => {
    const spotlightInterval = setInterval(() => {
      setSpotlight(s => s + 1)
    }, 8000)
    return () => clearInterval(spotlightInterval)
  }, [])

  const handleInteraction = useCallback(() => {
    setLastActivity(Date.now())
    setSleeping(false)
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayInstances = choreInstances.filter(ci => ci.dueDate === today)

  const upcomingActivities = activities
    .filter(a => new Date(a.start) >= new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 3)

  // Spotlight items
  const spotlightItems: { emoji: string; text: string }[] = []
  users.forEach(u => {
    const userBadges = badges.filter(b => b.userId === u.id)
    if (userBadges.length > 0) {
      const latestBadge = userBadges[userBadges.length - 1]
      const def = BADGE_DEFINITIONS[latestBadge.badgeKey]
      if (def) spotlightItems.push({ emoji: def.emoji, text: `${u.name} earned "${def.name}"!` })
    }
    if ((u.streak ?? 0) >= 3) {
      spotlightItems.push({ emoji: '🔥', text: `${u.name} is on a ${u.streak}-day streak!` })
    }
  })
  if (spotlightItems.length === 0) {
    spotlightItems.push({ emoji: '⭐', text: 'Keep up the great work, family!' })
  }
  const currentSpotlight = spotlightItems[spotlight % spotlightItems.length]

  if (sleeping) {
    return (
      <div
        className="kiosk flex flex-col items-center justify-center bg-black cursor-pointer"
        onClick={handleInteraction}
      >
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="text-center"
        >
          <p className="text-white/60 text-8xl font-black">
            {format(time, 'h:mm')}
          </p>
          <p className="text-white/40 text-xl mt-2">{format(time, 'a')}</p>
          <div className="mt-8 flex gap-8">
            {users.map(u => (
              <div key={u.id} className="text-center">
                <span className="text-4xl">{u.avatar}</span>
                <PointsBadge points={getUserPoints(u.id)} size="sm" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className="kiosk overflow-y-auto bg-gray-950 text-white p-6"
      onClick={handleInteraction}
    >
      {/* Header: time + date */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-5xl font-black">{format(time, 'h:mm')}<span className="text-gray-400 text-3xl"> {format(time, 'a')}</span></p>
          <p className="text-gray-400 text-lg">{format(time, 'EEEE, MMMM d')}</p>
        </div>
        <button onClick={() => navigate('/')} className="text-gray-600 text-sm p-2 rounded-xl hover:text-gray-400">
          Exit Wall Mode
        </button>
      </div>

      {/* Spotlight */}
      <AnimatePresence mode="wait">
        <motion.div
          key={spotlight}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6 rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}
        >
          <span className="text-4xl">{currentSpotlight.emoji}</span>
          <p className="text-xl font-bold">{currentSpotlight.text}</p>
        </motion.div>
      </AnimatePresence>

      {/* Kids cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {users.map(u => {
          const pts = getUserPoints(u.id)
          const kidInstances = todayInstances.filter(ci => ci.assignedTo === u.id)
          const done = kidInstances.filter(ci => ci.status === 'approved').length
          const total = kidInstances.length
          const remaining = kidInstances.filter(ci => ci.status === 'pending')

          return (
            <div
              key={u.id}
              className="rounded-3xl p-5"
              style={{ background: `linear-gradient(135deg, ${u.accentColor}33, ${u.accentColor}11)`, border: `1px solid ${u.accentColor}44` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-5xl">{u.avatar}</span>
                <div>
                  <p className="text-2xl font-black">{u.name}</p>
                  <PointsBadge points={pts} size="md" />
                </div>
              </div>

              {total > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Today's chores</span>
                    <span>{done}/{total}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${total > 0 ? (done / total) * 100 : 0}%`, backgroundColor: u.accentColor }}
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-1.5">
                {remaining.slice(0, 4).map(ci => {
                  const chore = chores.find(c => c.id === ci.choreId)
                  if (!chore) return null
                  return (
                    <div key={ci.id} className="flex items-center gap-2 text-sm text-gray-300">
                      <span>{chore.emoji}</span>
                      <span>{chore.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Upcoming activities */}
      {upcomingActivities.length > 0 && (
        <div>
          <p className="text-gray-400 font-semibold text-sm mb-3">COMING UP</p>
          <div className="grid gap-2">
            {upcomingActivities.map(a => {
              const assignedUsers = users.filter(u => a.assignedTo.includes(u.id))
              return (
                <div key={a.id} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-3xl">{a.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold">{a.title}</p>
                    <p className="text-gray-400 text-sm">
                      {format(parseISO(a.start), 'EEE MMM d')}
                      {a.start.includes('T') ? ' · ' + format(parseISO(a.start), 'h:mm a') : ''}
                      {a.location ? ` · ${a.location}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {assignedUsers.map(u => <span key={u.id} className="text-2xl">{u.avatar}</span>)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
