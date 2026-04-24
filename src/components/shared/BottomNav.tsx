import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, Gift, Calendar, Star } from 'lucide-react'
import type { UserRole } from '../../types'

interface Props {
  role: UserRole
}

const kidLinks = [
  { to: '/kid', icon: Home, label: 'Home' },
  { to: '/kid/chores', icon: CheckSquare, label: 'Chores' },
  { to: '/kid/prizes', icon: Gift, label: 'Prizes' },
  { to: '/kid/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/kid/badges', icon: Star, label: 'Badges' },
]

const parentLinks = [
  { to: '/parent', icon: Home, label: 'Home' },
  { to: '/parent/approvals', icon: CheckSquare, label: 'Approvals' },
  { to: '/parent/manage', icon: Star, label: 'Manage' },
  { to: '/parent/reports', icon: Calendar, label: 'Reports' },
]

export function BottomNav({ role }: Props) {
  const links = role === 'kid' ? kidLinks : parentLinks

  return (
    <nav className="fixed bottom-0 left-0 right-0 pb-safe z-30 card rounded-none border-x-0 border-b-0 rounded-t-2xl">
      <div className="flex items-center justify-around py-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/kid' || to === '/parent'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-accent font-bold scale-110' : 'text-text-muted'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
