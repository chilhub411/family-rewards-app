import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, Gift, Calendar, Star, Bell } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import type { UserRole } from '../../types'

interface Props { role: UserRole }

const kidLinks = [
  { to: '/kid',          icon: Home,        label: 'Home'   },
  { to: '/kid/chores',   icon: CheckSquare, label: 'Chores' },
  { to: '/kid/prizes',   icon: Gift,        label: 'Prizes' },
  { to: '/kid/calendar', icon: Calendar,    label: 'Calendar' },
  { to: '/kid/badges',   icon: Star,        label: 'Badges' },
]

const parentLinks = [
  { to: '/parent',           icon: Home,        label: 'Home'     },
  { to: '/parent/approvals', icon: Bell,        label: 'Approvals'},
  { to: '/parent/manage',    icon: CheckSquare, label: 'Manage'   },
  { to: '/parent/reports',   icon: Star,        label: 'Reports'  },
]

export function BottomNav({ role }: Props) {
  const links = role === 'kid' ? kidLinks : parentLinks
  const user = useAppStore(s => s.getCurrentUser())
  const accentColor = user?.accentColor ?? '#6366f1'

  const pendingCount = useAppStore(s =>
    s.choreInstances.filter(ci => ci.status === 'submitted').length +
    s.redemptions.filter(r => r.status === 'pending').length +
    s.transfers.filter(t => t.status === 'pending').length
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 pb-safe z-30 bottom-nav">
      <div className="flex items-center justify-around py-1 px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/kid' || to === '/parent'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-all relative ${
                isActive ? 'font-black' : 'font-semibold'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isActive ? '' : ''}`}
                  style={isActive ? { background: accentColor + '18' } : {}}>
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isActive ? accentColor : 'var(--text-muted)' }}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>
                <span className="text-[10px]" style={{ color: isActive ? accentColor : 'var(--text-muted)' }}>
                  {label}
                </span>
                {/* Badge for approvals */}
                {label === 'Approvals' && pendingCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-black">
                    {pendingCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
