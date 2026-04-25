import { useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { PointsBadge } from '../../components/shared/PointsBadge'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { subDays, format, parseISO } from 'date-fns'
import { Download } from 'lucide-react'

export function ParentReports() {
  const users = useAppStore(s => s.users.filter(u => u.role === 'kid' && !u.archived))
  const ledger = useAppStore(s => s.ledger)
  const choreInstances = useAppStore(s => s.choreInstances)
  const chores = useAppStore(s => s.chores)
  const redemptions = useAppStore(s => s.redemptions)
  const behaviorLogs = useAppStore(s => s.behaviorLogs)
  const getUserPoints = useAppStore(s => s.getUserPoints)

  const [selectedKid, setSelectedKid] = useState<string | null>(null)

  const targetUsers = selectedKid ? users.filter(u => u.id === selectedKid) : users

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
    const label = format(subDays(new Date(), 29 - i), 'MMM d')
    return { date, label }
  })

  const chartData = last30.map(({ date, label }) => {
    const row: Record<string, string | number> = { date: label }
    for (const user of targetUsers) {
      row[user.name] = ledger
        .filter(e => e.userId === user.id && e.amount > 0 && e.createdAt.startsWith(date))
        .reduce((s, e) => s + e.amount, 0)
    }
    return row
  })

  const COLORS = targetUsers.map(u => u.accentColor)

  const exportCSV = () => {
    const rows = [['Date', 'Name', 'Amount', 'Reason', 'Type']]
    ledger.forEach(e => {
      const u = users.find(u => u.id === e.userId)
      if (!u) return
      rows.push([e.createdAt.split('T')[0], u.name, e.amount.toString(), e.reason, e.sourceType])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'family-rewards-history.csv'
    a.click()
  }

  return (
    <div className="min-h-screen pb-24 pt-safe px-4">
      <div className="pt-4 mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black">Reports</h1>
        <button onClick={exportCSV} className="card p-2 text-text-muted hover:opacity-70 flex items-center gap-1 text-sm">
          <Download className="w-4 h-4" /> CSV
        </button>
      </div>

      {/* Kid filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedKid(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm ${!selectedKid ? 'text-white' : 'card text-text-muted'}`}
          style={!selectedKid ? { backgroundColor: 'var(--accent)' } : {}}
        >
          All Kids
        </button>
        {users.map(u => (
          <button
            key={u.id}
            onClick={() => setSelectedKid(u.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm ${selectedKid === u.id ? 'text-white' : 'card text-text-muted'}`}
            style={selectedKid === u.id ? { backgroundColor: u.accentColor } : {}}
          >
            {u.avatar} {u.name}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {targetUsers.map(u => {
          const pts = getUserPoints(u.id)
          const earned = ledger.filter(e => e.userId === u.id && e.amount > 0).reduce((s, e) => s + e.amount, 0)
          const spent = ledger.filter(e => e.userId === u.id && e.amount < 0).reduce((s, e) => s + e.amount, 0)
          const choresDone = choreInstances.filter(ci => ci.assignedTo === u.id && ci.status === 'approved').length
          return (
            <div key={u.id} className="card p-4" style={{ borderLeft: `4px solid ${u.accentColor}` }}>
              <div className="flex items-center gap-2 mb-2">
                <span>{u.avatar}</span>
                <span className="font-bold">{u.name}</span>
              </div>
              <PointsBadge points={pts} size="sm" />
              <div className="mt-2 grid gap-1 text-xs text-text-muted">
                <div className="flex justify-between"><span>Earned:</span><span className="text-green-500 font-bold">+{earned}</span></div>
                <div className="flex justify-between"><span>Spent:</span><span className="text-red-500 font-bold">{spent}</span></div>
                <div className="flex justify-between"><span>Chores done:</span><span className="font-bold">{choresDone}</span></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Points chart */}
      <div className="card p-4 mb-4">
        <p className="font-bold mb-3">Points Earned — Last 30 Days</p>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} />
            <Tooltip
              contentStyle={{ background: 'var(--surface-raised)', border: 'none', borderRadius: 12, fontSize: 12 }}
            />
            {targetUsers.map((u, i) => (
              <Bar key={u.id} dataKey={u.name} fill={COLORS[i]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mood history */}
      {targetUsers.map(u => {
        const moods = behaviorLogs.filter(b => b.userId === u.id).slice(-10).reverse()
        if (moods.length === 0) return null
        return (
          <div key={u.id} className="card p-4 mb-4">
            <p className="font-bold mb-3">{u.avatar} {u.name} — Mood History</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {moods.map(m => (
                <div key={m.id} className="flex flex-col items-center gap-1 flex-shrink-0">
                  <span className="text-2xl">{m.moodEmoji}</span>
                  <span className="text-xs text-text-muted">{format(parseISO(m.date), 'M/d')}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Recent transactions */}
      <div className="card p-4 mb-4">
        <p className="font-bold mb-3">Recent Transactions</p>
        <div className="grid gap-2">
          {ledger
            .filter(e => targetUsers.some(u => u.id === e.userId))
            .slice(-20)
            .reverse()
            .map(e => {
              const u = users.find(u => u.id === e.userId)
              return (
                <div key={e.id} className="flex items-center gap-2 text-sm">
                  <span>{u?.avatar}</span>
                  <span className={`font-bold ${e.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {e.amount > 0 ? '+' : ''}{e.amount}
                  </span>
                  <span className="text-text-muted flex-1 truncate">{e.reason}</span>
                  <span className="text-text-muted text-xs">{format(parseISO(e.createdAt), 'M/d')}</span>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
