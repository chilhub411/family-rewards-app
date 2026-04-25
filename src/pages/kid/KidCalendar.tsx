import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import {
  format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function KidCalendar() {
  const user = useAppStore(s => s.getCurrentUser())
  const activities = useAppStore(s => s.activities)
  const choreInstances = useAppStore(s => s.choreInstances)
  const chores = useAppStore(s => s.chores)

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  if (!user) return null

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const weeks: Date[][] = []
  let day = calStart
  while (day <= calEnd) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(day)
      day = addDays(day, 1)
    }
    weeks.push(week)
  }

  // Events for a given date
  const getEvents = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const acts = activities.filter(a =>
      a.assignedTo.includes(user.id) && a.start.startsWith(dateStr)
    )
    const cis = choreInstances.filter(ci =>
      ci.assignedTo === user.id && ci.dueDate === dateStr
    )
    return { activities: acts, chores: cis }
  }

  // Dot indicators for calendar
  const hasDot = (date: Date) => {
    const { activities: acts, chores: cis } = getEvents(date)
    return acts.length > 0 || cis.length > 0
  }

  const selectedEvents = getEvents(selectedDate)
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')

  return (
    <div className="min-h-screen pb-28 pt-safe flex flex-col" style={{ background: 'var(--surface)' }}>

      {/* Month header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-black">{format(currentMonth, 'MMMM yyyy')}</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="w-9 h-9 card flex items-center justify-center hover:opacity-70"
          >
            <ChevronLeft className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
          <button
            onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()) }}
            className="px-3 py-1.5 rounded-xl text-xs font-black"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="w-9 h-9 card flex items-center justify-center hover:opacity-70"
          >
            <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="px-5 grid grid-cols-7 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs font-black py-1" style={{ color: 'var(--text-muted)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="px-5 mb-4">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((date, di) => {
              const isSelected = isSameDay(date, selectedDate)
              const isCurrentMonth = isSameMonth(date, currentMonth)
              const isTodayDate = isToday(date)
              const dot = hasDot(date)

              return (
                <button
                  key={di}
                  onClick={() => setSelectedDate(date)}
                  className="flex flex-col items-center py-1.5 relative"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all"
                    style={{
                      background: isSelected
                        ? user.accentColor
                        : isTodayDate
                        ? user.accentColor + '20'
                        : 'transparent',
                      color: isSelected
                        ? 'white'
                        : !isCurrentMonth
                        ? 'var(--text-muted)'
                        : isTodayDate
                        ? user.accentColor
                        : 'var(--text-primary)',
                      opacity: isCurrentMonth ? 1 : 0.35,
                    }}
                  >
                    {format(date, 'd')}
                  </div>
                  {dot && (
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-0.5"
                      style={{ background: isSelected ? 'white' : user.accentColor }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Selected day events */}
      <div className="px-5 flex-1">
        <p className="section-title">
          {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDateStr}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="grid gap-2"
          >
            {selectedEvents.activities.length === 0 && selectedEvents.chores.length === 0 && (
              <div className="card p-8 text-center">
                <p className="text-3xl mb-2">📭</p>
                <p className="font-bold" style={{ color: 'var(--text-muted)' }}>Nothing scheduled</p>
              </div>
            )}

            {selectedEvents.activities.map(a => (
              <div key={a.id} className="card p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: user.accentColor + '18' }}>
                  {a.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-black">{a.title}</p>
                  {a.start.includes('T') && (
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                      {format(parseISO(a.start), 'h:mm a')}
                      {a.end ? ` – ${format(parseISO(a.end), 'h:mm a')}` : ''}
                    </p>
                  )}
                  {a.location && (
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      📍 {a.location}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {selectedEvents.chores.map(ci => {
              const chore = chores.find(c => c.id === ci.choreId)
              if (!chore) return null
              const isDone = ci.status === 'approved'
              return (
                <div key={ci.id} className="card p-4 flex items-center gap-3"
                  style={isDone ? { opacity: 0.6 } : {}}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: isDone ? '#22c55e20' : 'var(--surface-sunken)' }}>
                    {isDone ? '✅' : chore.emoji}
                  </div>
                  <div className="flex-1">
                    <p className={`font-black ${isDone ? 'line-through' : ''}`}>{chore.name}</p>
                    <p className="text-sm font-semibold" style={{ color: isDone ? '#22c55e' : 'var(--text-muted)' }}>
                      {isDone ? 'Done ✓' : `+${chore.pointValue} pts`}
                    </p>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
