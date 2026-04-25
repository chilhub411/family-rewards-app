import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  User, PointsLedger, Chore, ChoreInstance, Prize, Redemption,
  Activity, BehaviorLog, Badge, WishlistItem, Transfer, AppSettings
} from '../types'
import { generateId, hashPin } from '../utils/crypto'
import { todayStr, nowISO } from '../utils/date'
import { BADGE_DEFINITIONS, getLevelForPoints } from '../types'

interface AppState {
  // Auth
  currentUserId: string | null
  sessionStarted: string | null

  // Data
  users: User[]
  ledger: PointsLedger[]
  chores: Chore[]
  choreInstances: ChoreInstance[]
  prizes: Prize[]
  redemptions: Redemption[]
  activities: Activity[]
  behaviorLogs: BehaviorLog[]
  badges: Badge[]
  wishlist: WishlistItem[]
  transfers: Transfer[]
  settings: AppSettings

  // UI
  setupComplete: boolean

  // Auth actions
  login: (userId: string) => void
  logout: () => void
  getCurrentUser: () => User | null

  // User actions
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'archived' | 'level' | 'lifetimePoints' | 'streak'>) => User
  updateUser: (id: string, updates: Partial<User>) => void
  archiveUser: (id: string, by: string) => void
  deleteUser: (id: string) => void
  verifyPin: (userId: string, pin: string) => boolean

  // Points actions
  addPoints: (userId: string, amount: number, reason: string, sourceType: string, createdBy: string, sourceId?: string) => void
  getUserPoints: (userId: string) => number

  // Chore actions
  addChore: (chore: Omit<Chore, 'id' | 'createdAt'>) => Chore
  updateChore: (id: string, updates: Partial<Chore>) => void
  deleteChore: (id: string) => void
  generateChoreInstances: () => void
  submitChore: (instanceId: string, notes?: string) => void
  approveChore: (instanceId: string, approverId: string) => void
  denyChore: (instanceId: string) => void
  getTodayInstances: (userId?: string) => ChoreInstance[]

  // Prize actions
  addPrize: (prize: Omit<Prize, 'id' | 'createdAt'>) => void
  updatePrize: (id: string, updates: Partial<Prize>) => void
  deletePrize: (id: string) => void
  redeemPrize: (userId: string, prizeId: string) => void
  approveRedemption: (redemptionId: string, approverId: string) => void
  denyRedemption: (redemptionId: string) => void
  fulfillRedemption: (redemptionId: string) => void

  // Activity actions
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => void
  updateActivity: (id: string, updates: Partial<Activity>) => void
  deleteActivity: (id: string) => void

  // Behavior actions
  logBehavior: (userId: string, moodEmoji: string, note?: string) => void
  getTodayMood: (userId: string) => BehaviorLog | null

  // Wishlist actions
  addWishlistItem: (userId: string, name: string, notes?: string) => void
  updateWishlistStatus: (id: string, status: WishlistItem['status']) => void

  // Transfer actions
  requestTransfer: (fromUserId: string, toUserId: string, amount: number, message?: string, emoji?: string) => void
  approveTransfer: (transferId: string, approverId: string, bonusAmount?: number, bonusReason?: string) => void
  denyTransfer: (transferId: string) => void

  // Badge actions
  awardBadge: (userId: string, badgeKey: string) => void
  checkAndAwardBadges: (userId: string) => void

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void
  completeSetup: () => void
  seedDemoData: () => void
}

const DEFAULT_SETTINGS: AppSettings = {
  wallTheme: 'dark',
  autoDeductEnabled: false,
  requireChoreApproval: true,
  allowNegativeBalance: false,
  transferDailyMax: 50,
  transferWeeklyMax: 3,
  transferMinBalance: 0,
  transferCooldownHours: 1,
  leaderboardVisible: true,
  soundEnabled: true,
  wallAutoRefreshSeconds: 30,
  wallSleepAfterMinutes: 5,
  firstRunComplete: false,
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      sessionStarted: null,
      users: [],
      ledger: [],
      chores: [],
      choreInstances: [],
      prizes: [],
      redemptions: [],
      activities: [],
      behaviorLogs: [],
      badges: [],
      wishlist: [],
      transfers: [],
      settings: DEFAULT_SETTINGS,
      setupComplete: false,

      login: (userId) => set({ currentUserId: userId, sessionStarted: nowISO() }),
      logout: () => set({ currentUserId: null, sessionStarted: null }),
      getCurrentUser: () => {
        const { users, currentUserId } = get()
        return users.find(u => u.id === currentUserId) ?? null
      },

      addUser: (userData) => {
        const user: User = {
          ...userData,
          id: generateId(),
          createdAt: nowISO(),
          archived: false,
          level: 1,
          lifetimePoints: 0,
          streak: 0,
        }
        set(s => ({ users: [...s.users, user] }))
        return user
      },

      updateUser: (id, updates) =>
        set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...updates } : u) })),

      archiveUser: (id, _by) =>
        set(s => ({
          users: s.users.map(u => u.id === id ? { ...u, archived: true, archivedAt: nowISO() } : u)
        })),

      deleteUser: (id) =>
        set(s => ({ users: s.users.filter(u => u.id !== id) })),

      verifyPin: (userId, pin) => {
        const user = get().users.find(u => u.id === userId)
        if (!user) return false
        return user.pinHash === hashPin(pin)
      },

      addPoints: (userId, amount, reason, sourceType, createdBy, sourceId) => {
        const entry: PointsLedger = {
          id: generateId(),
          userId,
          amount,
          reason,
          sourceType: sourceType as PointsLedger['sourceType'],
          sourceId,
          createdBy,
          createdAt: nowISO(),
        }
        set(s => ({ ledger: [...s.ledger, entry] }))
        if (amount > 0) {
          const user = get().users.find(u => u.id === userId)
          const newLifetime = (user?.lifetimePoints ?? 0) + amount
          set(s => ({
            users: s.users.map(u => u.id === userId ? { ...u, lifetimePoints: newLifetime } : u)
          }))
          get().checkAndAwardBadges(userId)
        }
      },

      getUserPoints: (userId) => {
        return get().ledger
          .filter(e => e.userId === userId)
          .reduce((sum, e) => sum + e.amount, 0)
      },

      addChore: (choreData) => {
        const chore: Chore = { ...choreData, id: generateId(), createdAt: nowISO() }
        set(s => ({ chores: [...s.chores, chore] }))
        get().generateChoreInstances()
        return chore
      },

      updateChore: (id, updates) =>
        set(s => ({ chores: s.chores.map(c => c.id === id ? { ...c, ...updates } : c) })),

      deleteChore: (id) =>
        set(s => ({
          chores: s.chores.filter(c => c.id !== id),
          choreInstances: s.choreInstances.filter(ci => ci.choreId !== id),
        })),

      generateChoreInstances: () => {
        const { chores, choreInstances } = get()
        const newInstances: ChoreInstance[] = []
        const today = todayStr()

        for (const chore of chores.filter(c => c.active)) {
          const days = chore.frequency === 'daily' ? 7 : chore.frequency === 'weekly' ? 4 : 1
          const step = chore.frequency === 'weekly' ? 7 : 1

          for (let i = 0; i < days; i++) {
            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + i * step)
            const dueDateStr = dueDate.toISOString().split('T')[0]
            if (dueDateStr < today) continue

            for (const userId of chore.assignedTo) {
              const exists = choreInstances.some(
                ci => ci.choreId === chore.id && ci.assignedTo === userId && ci.dueDate === dueDateStr
              )
              if (!exists) {
                newInstances.push({
                  id: generateId(),
                  choreId: chore.id,
                  assignedTo: userId,
                  dueDate: dueDateStr,
                  status: 'pending',
                  createdAt: nowISO(),
                })
              }
            }
          }
        }

        if (newInstances.length > 0) {
          set(s => ({ choreInstances: [...s.choreInstances, ...newInstances] }))
        }
      },

      submitChore: (instanceId, notes) => {
        const { choreInstances, chores, settings } = get()
        const instance = choreInstances.find(ci => ci.id === instanceId)
        if (!instance) return
        const chore = chores.find(c => c.id === instance.choreId)
        if (!chore) return

        if (!chore.requiresApproval || !settings.requireChoreApproval) {
          set(s => ({
            choreInstances: s.choreInstances.map(ci =>
              ci.id === instanceId
                ? { ...ci, status: 'approved', completedAt: nowISO(), notes }
                : ci
            )
          }))
          get().addPoints(instance.assignedTo, chore.pointValue, `Completed: ${chore.name}`, 'chore', 'system', chore.id)
          get().checkAndAwardBadges(instance.assignedTo)
        } else {
          set(s => ({
            choreInstances: s.choreInstances.map(ci =>
              ci.id === instanceId
                ? { ...ci, status: 'submitted', completedAt: nowISO(), notes }
                : ci
            )
          }))
        }
      },

      approveChore: (instanceId, approverId) => {
        const { choreInstances, chores } = get()
        const instance = choreInstances.find(ci => ci.id === instanceId)
        if (!instance) return
        const chore = chores.find(c => c.id === instance.choreId)
        if (!chore) return

        set(s => ({
          choreInstances: s.choreInstances.map(ci =>
            ci.id === instanceId
              ? { ...ci, status: 'approved', approvedBy: approverId }
              : ci
          )
        }))
        get().addPoints(instance.assignedTo, chore.pointValue, `Approved: ${chore.name}`, 'chore', approverId, chore.id)
        get().checkAndAwardBadges(instance.assignedTo)
      },

      denyChore: (instanceId) =>
        set(s => ({
          choreInstances: s.choreInstances.map(ci =>
            ci.id === instanceId ? { ...ci, status: 'denied' } : ci
          )
        })),

      getTodayInstances: (userId) => {
        const { choreInstances } = get()
        const today = todayStr()
        return choreInstances.filter(ci =>
          ci.dueDate === today && (userId ? ci.assignedTo === userId : true)
        )
      },

      addPrize: (prizeData) =>
        set(s => ({ prizes: [...s.prizes, { ...prizeData, id: generateId(), createdAt: nowISO() }] })),

      updatePrize: (id, updates) =>
        set(s => ({ prizes: s.prizes.map(p => p.id === id ? { ...p, ...updates } : p) })),

      deletePrize: (id) =>
        set(s => ({ prizes: s.prizes.filter(p => p.id !== id) })),

      redeemPrize: (userId, prizeId) => {
        const prize = get().prizes.find(p => p.id === prizeId)
        if (!prize) return
        const points = get().getUserPoints(userId)
        if (points < prize.cost) return

        const redemption: Redemption = {
          id: generateId(),
          userId,
          prizeId,
          costAtRedemption: prize.cost,
          status: 'pending',
          requestedAt: nowISO(),
        }
        set(s => ({ redemptions: [...s.redemptions, redemption] }))
      },

      approveRedemption: (redemptionId, approverId) => {
        const { redemptions, prizes } = get()
        const redemption = redemptions.find(r => r.id === redemptionId)
        if (!redemption) return
        const prize = prizes.find(p => p.id === redemption.prizeId)

        set(s => ({
          redemptions: s.redemptions.map(r =>
            r.id === redemptionId ? { ...r, status: 'approved', approvedBy: approverId } : r
          )
        }))
        get().addPoints(
          redemption.userId,
          -redemption.costAtRedemption,
          `Redeemed: ${prize?.name ?? 'Prize'}`,
          'redemption',
          approverId,
          redemptionId
        )
        get().awardBadge(redemption.userId, 'first_redeem')
      },

      denyRedemption: (redemptionId) =>
        set(s => ({
          redemptions: s.redemptions.map(r =>
            r.id === redemptionId ? { ...r, status: 'denied' } : r
          )
        })),

      fulfillRedemption: (redemptionId) =>
        set(s => ({
          redemptions: s.redemptions.map(r =>
            r.id === redemptionId ? { ...r, status: 'fulfilled', fulfilledAt: nowISO() } : r
          )
        })),

      addActivity: (activityData) =>
        set(s => ({ activities: [...s.activities, { ...activityData, id: generateId(), createdAt: nowISO() }] })),

      updateActivity: (id, updates) =>
        set(s => ({ activities: s.activities.map(a => a.id === id ? { ...a, ...updates } : a) })),

      deleteActivity: (id) =>
        set(s => ({ activities: s.activities.filter(a => a.id !== id) })),

      logBehavior: (userId, moodEmoji, note) => {
        const today = todayStr()
        const log: BehaviorLog = {
          id: generateId(),
          userId,
          date: today,
          moodEmoji: moodEmoji as BehaviorLog['moodEmoji'],
          note,
        }
        set(s => ({
          behaviorLogs: [...s.behaviorLogs.filter(b => !(b.userId === userId && b.date === today)), log]
        }))
      },

      getTodayMood: (userId) => {
        const today = todayStr()
        return get().behaviorLogs.find(b => b.userId === userId && b.date === today) ?? null
      },

      addWishlistItem: (userId, name, notes) =>
        set(s => ({
          wishlist: [...s.wishlist, {
            id: generateId(), userId, name, notes, status: 'submitted', createdAt: nowISO()
          }]
        })),

      updateWishlistStatus: (id, status) =>
        set(s => ({ wishlist: s.wishlist.map(w => w.id === id ? { ...w, status } : w) })),

      requestTransfer: (fromUserId, toUserId, amount, message, emoji) => {
        const transfer: Transfer = {
          id: generateId(),
          fromUserId,
          toUserId,
          amount,
          message,
          emoji,
          status: 'pending',
          requestedAt: nowISO(),
        }
        set(s => ({ transfers: [...s.transfers, transfer] }))
      },

      approveTransfer: (transferId, approverId, bonusAmount, bonusReason) => {
        const { transfers, users } = get()
        const transfer = transfers.find(t => t.id === transferId)
        if (!transfer) return
        const fromUser = users.find(u => u.id === transfer.fromUserId)
        const toUser = users.find(u => u.id === transfer.toUserId)

        set(s => ({
          transfers: s.transfers.map(t =>
            t.id === transferId
              ? { ...t, status: 'approved', approvedBy: approverId, approvedAt: nowISO(), parentBonusAmount: bonusAmount, parentBonusReason: bonusReason }
              : t
          )
        }))

        get().addPoints(transfer.fromUserId, -transfer.amount, `💝 Sent to ${toUser?.name}`, 'transfer', approverId, transferId)
        get().addPoints(transfer.toUserId, transfer.amount, `🎁 Gift from ${fromUser?.name}`, 'transfer', approverId, transferId)

        if (bonusAmount && bonusAmount > 0) {
          get().addPoints(transfer.fromUserId, bonusAmount, bonusReason ?? 'Bonus for generosity', 'bonus', approverId)
        }

        get().awardBadge(transfer.fromUserId, 'generous')
      },

      denyTransfer: (transferId) =>
        set(s => ({
          transfers: s.transfers.map(t =>
            t.id === transferId ? { ...t, status: 'denied' } : t
          )
        })),

      awardBadge: (userId, badgeKey) => {
        if (!BADGE_DEFINITIONS[badgeKey]) return
        const exists = get().badges.some(b => b.userId === userId && b.badgeKey === badgeKey)
        if (exists) return
        set(s => ({
          badges: [...s.badges, { id: generateId(), userId, badgeKey, earnedAt: nowISO() }]
        }))
      },

      checkAndAwardBadges: (userId) => {
        const { awardBadge, getUserPoints, choreInstances } = get()
        const lifetimePoints = get().users.find(u => u.id === userId)?.lifetimePoints ?? 0

        if (lifetimePoints >= 100) awardBadge(userId, 'points_100')
        if (lifetimePoints >= 500) awardBadge(userId, 'points_500')
        if (lifetimePoints >= 1000) awardBadge(userId, 'points_1000')

        const hasCompletedChore = choreInstances.some(ci => ci.assignedTo === userId && ci.status === 'approved')
        if (hasCompletedChore) awardBadge(userId, 'first_chore')

        // Update user level
        const level = getLevelForPoints(lifetimePoints)
        get().updateUser(userId, { level: level.level })
      },

      updateSettings: (updates) =>
        set(s => ({ settings: { ...s.settings, ...updates } })),

      completeSetup: () => {
        set(s => ({ setupComplete: true, settings: { ...s.settings, firstRunComplete: true } }))
      },

      seedDemoData: () => {
        const { addUser, addChore, addPrize, addActivity, generateChoreInstances, completeSetup } = get()

        const parent = addUser({
          name: 'Parent',
          role: 'parent',
          avatar: '🧑‍💼',
          accentColor: '#6366f1',
          themePreference: 'auto',
          pinHash: hashPin('1234'),
          passwordHash: hashPin('password'),
          email: 'parent@family.com',
        })

        const layla = addUser({
          name: 'Layla',
          role: 'kid',
          age: 10,
          avatar: '🦋',
          accentColor: '#a855f7',
          themePreference: 'dark',
          pinHash: hashPin('1111'),
        })

        const jack = addUser({
          name: 'Jack',
          role: 'kid',
          age: 8,
          avatar: '⚡',
          accentColor: '#22c55e',
          themePreference: 'auto',
          pinHash: hashPin('2222'),
        })

        // Seed starting points
        const now = nowISO()
        const seedLedger = (userId: string, amount: number, reason: string) => {
          get().addPoints(userId, amount, reason, 'manual', parent.id)
        }

        seedLedger(layla.id, 120, 'Starting balance')
        seedLedger(jack.id, 85, 'Starting balance')

        addChore({
          name: 'Make Bed',
          emoji: '🛏️',
          pointValue: 5,
          assignedTo: [layla.id, jack.id],
          frequency: 'daily',
          requiresApproval: false,
          autoDeductIfMissed: false,
          active: true,
        })

        addChore({
          name: 'Homework',
          emoji: '📚',
          pointValue: 15,
          assignedTo: [layla.id, jack.id],
          frequency: 'daily',
          requiresApproval: true,
          autoDeductIfMissed: false,
          active: true,
        })

        addChore({
          name: 'Feed the Dog',
          emoji: '🐕',
          pointValue: 10,
          assignedTo: [layla.id],
          frequency: 'daily',
          requiresApproval: false,
          autoDeductIfMissed: false,
          active: true,
        })

        addChore({
          name: 'Clean Room',
          emoji: '🧹',
          pointValue: 20,
          assignedTo: [layla.id, jack.id],
          frequency: 'weekly',
          requiresApproval: true,
          autoDeductIfMissed: false,
          active: true,
        })

        addChore({
          name: 'Take Out Trash',
          emoji: '🗑️',
          pointValue: 10,
          assignedTo: [jack.id],
          frequency: 'weekly',
          requiresApproval: false,
          autoDeductIfMissed: false,
          active: true,
        })

        addPrize({
          name: '15 min YouTube',
          emoji: '📺',
          cost: 20,
          category: 'screen_time',
          limitType: 'daily',
          active: true,
        })

        addPrize({
          name: '30 min Video Games',
          emoji: '🎮',
          cost: 40,
          category: 'screen_time',
          limitType: 'daily',
          active: true,
        })

        addPrize({
          name: 'Pick Dinner',
          emoji: '🍕',
          cost: 75,
          category: 'privilege',
          limitType: 'weekly',
          active: true,
        })

        addPrize({
          name: 'Movie Night Pick',
          emoji: '🎬',
          cost: 100,
          category: 'privilege',
          limitType: 'weekly',
          active: true,
        })

        addPrize({
          name: 'Stay Up 30 min Late',
          emoji: '🌙',
          cost: 150,
          category: 'privilege',
          limitType: 'weekly',
          active: true,
        })

        addPrize({
          name: 'Old iPad',
          emoji: '📱',
          cost: 500,
          category: 'physical',
          limitType: 'once_ever',
          active: true,
        })

        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        addActivity({
          title: 'Flag Football Practice',
          emoji: '🏈',
          assignedTo: [jack.id],
          start: tomorrow.toISOString().split('T')[0] + 'T16:00:00',
          end: tomorrow.toISOString().split('T')[0] + 'T17:30:00',
          location: 'Town Park Field 2',
        })

        addActivity({
          title: 'Band Practice',
          emoji: '🎵',
          assignedTo: [layla.id],
          start: tomorrow.toISOString().split('T')[0] + 'T15:00:00',
          end: tomorrow.toISOString().split('T')[0] + 'T16:00:00',
          location: 'School Music Room',
        })

        generateChoreInstances()
        completeSetup()
      },
    }),
    {
      name: 'family-rewards-store',
      version: 1,
    }
  )
)
