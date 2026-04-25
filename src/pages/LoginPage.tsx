import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../stores/appStore'
import { PinPad } from '../components/shared/PinPad'
import type { User } from '../types'

type Step = 'select' | 'pin'

const ROLE_COLORS: Record<string, string> = {
  parent: '#6366f1',
}

export function LoginPage() {
  const navigate = useNavigate()
  const users = useAppStore(s => s.users.filter(u => !u.archived))
  const login = useAppStore(s => s.login)
  const verifyPin = useAppStore(s => s.verifyPin)
  const setupComplete = useAppStore(s => s.setupComplete)

  const [step, setStep] = useState<Step>('select')
  const [selected, setSelected] = useState<User | null>(null)
  const [error, setError] = useState('')

  if (!setupComplete) {
    navigate('/setup', { replace: true })
    return null
  }

  const selectUser = (user: User) => {
    setSelected(user)
    setError('')
    setStep('pin')
  }

  const submitPin = (pin: string) => {
    if (!selected) return
    if (verifyPin(selected.id, pin)) {
      login(selected.id)
      navigate(selected.role === 'parent' ? '/parent' : '/kid')
    } else {
      setError('Wrong PIN — try again')
    }
  }

  const kids = users.filter(u => u.role === 'kid')
  const parents = users.filter(u => u.role === 'parent')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface)' }}>
      <AnimatePresence mode="wait">
        {step === 'select' ? (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col flex-1 px-5 pt-14 pb-8"
          >
            {/* Logo */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                ⭐
              </div>
              <h1 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Kudos</h1>
              <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1 font-semibold">Family Rewards</p>
            </div>

            {/* Kids */}
            {kids.length > 0 && (
              <div className="mb-6">
                <p className="section-title">Kids</p>
                <div className="grid gap-3">
                  {kids.map((user, i) => (
                    <motion.button
                      key={user.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectUser(user)}
                      className="card flex items-center gap-4 p-4 text-left hover:shadow-md transition-shadow"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: user.accentColor + '22' }}>
                        {user.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                        {user.age && <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Age {user.age}</p>}
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: user.accentColor + '15' }}>
                        <span style={{ color: user.accentColor }} className="text-lg">›</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Parents */}
            {parents.length > 0 && (
              <div className="mb-6">
                <p className="section-title">Parents</p>
                <div className="grid gap-3">
                  {parents.map((user, i) => (
                    <motion.button
                      key={user.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (kids.length + i) * 0.06 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectUser(user)}
                      className="card flex items-center gap-4 p-4 text-left hover:shadow-md transition-shadow"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: '#6366f122' }}>
                        {user.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Parent</p>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#6366f115' }}>
                        <span style={{ color: '#6366f1' }} className="text-lg">›</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/wall')}
              className="mt-auto text-center py-3 font-semibold rounded-2xl"
              style={{ color: 'var(--text-muted)', background: 'var(--surface-sunken)' }}
            >
              📺 Wall Display Mode
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="pin"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-col flex-1 items-center justify-center px-5"
          >
            <div className="w-full max-w-xs">
              {/* Avatar */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-3 shadow-md"
                  style={{ background: (selected?.accentColor ?? '#6366f1') + '22' }}>
                  {selected?.avatar}
                </div>
                <h2 className="text-2xl font-black">{selected?.name}</h2>
              </div>
              <PinPad
                onSubmit={submitPin}
                onCancel={() => { setStep('select'); setError('') }}
                error={error}
                label="Enter your PIN"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
