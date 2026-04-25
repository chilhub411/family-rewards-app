import { format, isToday, isTomorrow, isYesterday, parseISO, startOfDay, addDays } from 'date-fns'

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function generateDailyInstances(
  choreId: string,
  assignedTo: string[],
  daysAhead = 7
): Array<{ choreId: string; assignedTo: string; dueDate: string }> {
  const instances: Array<{ choreId: string; assignedTo: string; dueDate: string }> = []
  const today = startOfDay(new Date())
  for (let i = 0; i < daysAhead; i++) {
    const date = format(addDays(today, i), 'yyyy-MM-dd')
    for (const userId of assignedTo) {
      instances.push({ choreId, assignedTo: userId, dueDate: date })
    }
  }
  return instances
}

export function generateWeeklyInstances(
  choreId: string,
  assignedTo: string[],
  weeksAhead = 4
): Array<{ choreId: string; assignedTo: string; dueDate: string }> {
  const instances: Array<{ choreId: string; assignedTo: string; dueDate: string }> = []
  const today = startOfDay(new Date())
  for (let i = 0; i < weeksAhead; i++) {
    const date = format(addDays(today, i * 7), 'yyyy-MM-dd')
    for (const userId of assignedTo) {
      instances.push({ choreId, assignedTo: userId, dueDate: date })
    }
  }
  return instances
}
