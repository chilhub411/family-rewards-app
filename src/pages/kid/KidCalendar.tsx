import { useAppStore } from '../../stores/appStore'
import { format, parseISO, addDays } from 'date-fns'

export function KidCalendar() {
  const user = useAppStore(s => s.getCurrentUser())
  const activities = useAppStore(s => s.activities)
  const choreInstances = useAppStore(s => s.choreInstances)
  const chores = useAppStore(s => s.chores)

  if (!user) return null

  const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i))

  return (
    <div className="min-h-screen pb-24 pt-safe px-4">
      <div className="pt-4 mb-4">
        <h1 className="text-2xl font-black">Calendar</h1>
        <p className="text-text-muted text-sm">Next 2 weeks</p>
      </div>

      <div className="grid gap-4">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayActivities = activities.filter(a =>
            a.assignedTo.includes(user.id) && a.start.startsWith(dateStr)
          )
          const dayChores = choreInstances.filter(ci =>
            ci.assignedTo === user.id && ci.dueDate === dateStr
          )

          if (dayActivities.length === 0 && dayChores.length === 0) return null

          return (
            <div key={dateStr}>
              <p className="font-bold text-text-muted text-sm mb-2">
                {format(day, 'EEEE, MMMM d')}
              </p>
              <div className="grid gap-2">
                {dayActivities.map(a => (
                  <div key={a.id} className="card p-3 flex items-center gap-3">
                    <span className="text-2xl">{a.emoji}</span>
                    <div>
                      <p className="font-semibold">{a.title}</p>
                      {a.start.includes('T') && (
                        <p className="text-text-muted text-xs">
                          {format(parseISO(a.start), 'h:mm a')}
                          {a.end && ` – ${format(parseISO(a.end), 'h:mm a')}`}
                          {a.location && ` · ${a.location}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {dayChores.map(ci => {
                  const chore = chores.find(c => c.id === ci.choreId)
                  if (!chore) return null
                  return (
                    <div key={ci.id} className="card p-3 flex items-center gap-3 opacity-70">
                      <span className="text-2xl">{chore.emoji}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{chore.name}</p>
                        <p className="text-text-muted text-xs">+{chore.pointValue} pts</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        ci.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {ci.status === 'approved' ? '✓' : '○'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
