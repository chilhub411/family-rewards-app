export type UserRole = 'parent' | 'kid'
export type ThemePreference = 'light' | 'dark' | 'auto'
export type ChoreFrequency = 'once' | 'daily' | 'weekly' | 'custom'
export type ChoreStatus = 'pending' | 'submitted' | 'approved' | 'denied' | 'missed'
export type PrizeCategory = 'screen_time' | 'physical' | 'outing' | 'privilege'
export type PrizeLimitType = 'none' | 'daily' | 'weekly' | 'once_ever'
export type RedemptionStatus = 'pending' | 'approved' | 'denied' | 'fulfilled'
export type SourceType = 'chore' | 'behavior' | 'manual' | 'redemption' | 'bonus' | 'penalty' | 'transfer'
export type WishlistStatus = 'submitted' | 'approved' | 'denied' | 'added_to_store'
export type TransferStatus = 'pending' | 'approved' | 'denied' | 'reversed'
export type MoodEmoji = '😄' | '🙂' | '😐' | '😕' | '😢'

export interface User {
  id: string
  name: string
  role: UserRole
  age?: number
  birthday?: string
  avatar: string
  accentColor: string
  themePreference: ThemePreference
  pinHash: string
  passwordHash?: string
  email?: string
  archived: boolean
  archivedAt?: string
  createdAt: string
  createdBy?: string
  level?: number
  lifetimePoints?: number
  streak?: number
  lastChoreDate?: string
}

export interface PointsLedger {
  id: string
  userId: string
  amount: number
  reason: string
  sourceType: SourceType
  sourceId?: string
  createdBy: string
  createdAt: string
}

export interface Chore {
  id: string
  name: string
  emoji: string
  pointValue: number
  assignedTo: string[]
  frequency: ChoreFrequency
  schedule?: string
  dueTime?: string
  requiresApproval: boolean
  autoDeductIfMissed: boolean
  deductAmount?: number
  active: boolean
  createdAt: string
}

export interface ChoreInstance {
  id: string
  choreId: string
  assignedTo: string
  dueDate: string
  status: ChoreStatus
  completedAt?: string
  approvedBy?: string
  notes?: string
  createdAt: string
}

export interface Prize {
  id: string
  name: string
  emoji: string
  cost: number
  category: PrizeCategory
  limitType: PrizeLimitType
  stock?: number
  active: boolean
  createdAt: string
}

export interface Redemption {
  id: string
  userId: string
  prizeId: string
  costAtRedemption: number
  status: RedemptionStatus
  requestedAt: string
  approvedBy?: string
  fulfilledAt?: string
}

export interface Activity {
  id: string
  title: string
  emoji: string
  assignedTo: string[]
  start: string
  end?: string
  location?: string
  recurrence?: string
  reminderMinutesBefore?: number
  notes?: string
  createdAt: string
}

export interface BehaviorLog {
  id: string
  userId: string
  date: string
  moodEmoji: MoodEmoji
  note?: string
}

export interface Badge {
  id: string
  userId: string
  badgeKey: string
  earnedAt: string
}

export interface WishlistItem {
  id: string
  userId: string
  name: string
  notes?: string
  status: WishlistStatus
  createdAt: string
}

export interface Transfer {
  id: string
  fromUserId: string
  toUserId: string
  amount: number
  message?: string
  emoji?: string
  status: TransferStatus
  requestedAt: string
  approvedBy?: string
  approvedAt?: string
  reversedAt?: string
  reversedBy?: string
  parentBonusAmount?: number
  parentBonusReason?: string
  lockedUntil?: string
}

export interface AppSettings {
  wallTheme: ThemePreference
  autoDeductEnabled: boolean
  requireChoreApproval: boolean
  allowNegativeBalance: boolean
  transferDailyMax: number
  transferWeeklyMax: number
  transferMinBalance: number
  transferCooldownHours: number
  leaderboardVisible: boolean
  soundEnabled: boolean
  wallAutoRefreshSeconds: number
  wallSleepAfterMinutes: number
  firstRunComplete: boolean
}

export const BADGE_DEFINITIONS: Record<string, { name: string; emoji: string; description: string }> = {
  first_chore: { name: 'First Chore', emoji: '⭐', description: 'Completed your first chore!' },
  streak_3: { name: '3-Day Streak', emoji: '🔥', description: '3 days of completing all chores' },
  streak_7: { name: 'Week Warrior', emoji: '🏆', description: '7-day chore streak' },
  streak_30: { name: 'Month Master', emoji: '👑', description: '30-day chore streak' },
  points_100: { name: 'Century', emoji: '💯', description: 'Earned 100 points total' },
  points_500: { name: 'High Roller', emoji: '💎', description: 'Earned 500 points total' },
  points_1000: { name: 'Legend', emoji: '🌟', description: 'Earned 1000 points total' },
  first_redeem: { name: 'First Reward', emoji: '🎁', description: 'Redeemed your first prize' },
  perfect_week: { name: 'Perfect Week', emoji: '✨', description: 'Completed every chore for a week' },
  generous: { name: 'Generous', emoji: '💝', description: 'Gifted points to a sibling' },
}

export const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Apprentice', minPoints: 0 },
  { level: 2, name: 'Helper', minPoints: 100 },
  { level: 3, name: 'Pro', minPoints: 300 },
  { level: 4, name: 'Hero', minPoints: 600 },
  { level: 5, name: 'Champion', minPoints: 1000 },
  { level: 6, name: 'Legend', minPoints: 2000 },
]

export function getLevelForPoints(points: number) {
  let current = LEVEL_THRESHOLDS[0]
  for (const threshold of LEVEL_THRESHOLDS) {
    if (points >= threshold.minPoints) current = threshold
    else break
  }
  return current
}
