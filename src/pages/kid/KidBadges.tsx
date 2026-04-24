import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { PointsBadge } from '../../components/shared/PointsBadge'
import { BADGE_DEFINITIONS, getLevelForPoints, LEVEL_THRESHOLDS } from '../../types'
import { format, parseISO } from 'date-fns'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { subDays } from 'date-fns'

export function KidBadges() {
  const user = useAppStore(s => s.getCurrentUser())
  const badges = useAppStore(s => s.badges)
  const ledger = useAppStore(s => s.ledger)

  if (!user) return null

  const myBadges = badges.filter(b => b.userId === user.id)
  const earnedKeys = new Set(myBadges.map(b => b.badgeKey))

  const lifetime = user.lifetimePoints ?? 0
  const currentLevel = getLevelForPoints(lifetime)
  const nextLevel = LEVEL_THRESHOLDS.find(l => l.minPoints > lifetime)

  // Points chart — last 30 days
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
    const dayTotal = ledger
      .filter(e => e.userId === user.id && e.createdAt.startsWith(date))
      .reduce((sum, e) => sum + e.amount, 0)
    return { date: format(subDays(new Date(), 29 - i), 'MMM d'), pts: dayTotal }
  })

  // Running balance for chart
  let running = 0
  const balanceData = chartData.map(d => {
    running += d.pts
    return { ...d, balance: running }
  })

  return (
    <div className="min-h-screen pb-24 pt-safe px-4">
      <div className="pt-4 mb-4">
        <h1 className="text-2xl font-black">Stats & Badges</h1>
      </div>

      {/* Level card */}
      <div className="card p-5 mb-4"
        style={{ borderLeft: `4px solid ${user.accentColor}` }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-text-muted text-sm">Level {currentLevel.level}</p>
            <p className="text-2xl font-black">{currentLevel.name}</p>
          </div>
          <PointsBadge points={lifetime} size="md" />
        </div>
        {nextLevel && (
          <>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((lifetime - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100}%` }}
                transition={{ duration: 1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: user.accentColor }}
              />
            </div>
            <p className="text-text-muted text-xs">{nextLevel.minPoints - lifetime} pts to {nextLevel.name}</p>
          </>
        )}
      </div>

      {/* Points chart */}
      <div className="card p-4 mb-4">
        <p className="font-bold mb-3">Points — Last 30 Days</p>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={balanceData}>
            <defs>
              <linearGradient id="colorPts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={user.accentColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={user.accentColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <Tooltip
              contentStyle={{ background: 'var(--surface-raised)', border: 'none', borderRadius: 12 }}
              formatter={(v: number) => [`${v} pts`, 'Balance']}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={user.accentColor}
              fill="url(#colorPts)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Badges */}
      <h2 className="font-bold text-lg mb-3">
        Badges ({myBadges.length}/{Object.keys(BADGE_DEFINITIONS).length})
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(BADGE_DEFINITIONS).map(([key, def]) => {
          const earned = earnedKeys.has(key)
          const earnedBadge = myBadges.find(b => b.badgeKey === key)
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`card p-4 text-center ${!earned ? 'opacity-40' : ''}`}
            >
              <div className="text-4xl mb-2">{earned ? def.emoji : '🔒'}</div>
              <p className="font-bold text-sm">{def.name}</p>
              <p className="text-text-muted text-xs mt-1">{def.description}</p>
              {earned && earnedBadge && (
                <p className="text-xs mt-2" style={{ color: user.accentColor }}>
                  {format(parseISO(earnedBadge.earnedAt), 'MMM d, yyyy')}
                </p>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
