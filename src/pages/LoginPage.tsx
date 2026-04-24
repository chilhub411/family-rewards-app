import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../stores/appStore'
import { PinPad } from '../components/shared/PinPad'
import type { User } from '../types'

type Step = 'select' | 'pin'

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
      if (selected.role === 'parent') navigate('/parent')
      else navigate('/kid')
    } else {
      setError('Wrong PIN — try again')
    }
  }

  const wallDisplay = () => navigate('/wall')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-20 dark:opacity-40" />

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            className="text-6xl mb-2"
          >
            ⭐
          </motion.div>
          <h1 className="text-3xl font-black" style={{ color: 'var(--accent)' }}>Kudos</h1>
          <p className="text-text-muted text-sm mt-1">Family Rewards</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'select' ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <p className="text-center text-text-muted mb-4 font-medium">Who's logging in?</p>
              <div className="grid gap-3">
                {users.map(user => (
                  <motion.button
                    key={user.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => selectUser(user)}
                    className="card flex items-center gap-4 p-4 hover:opacity-90 transition-all text-left w-full"
                    style={user.role === 'kid' ? { borderLeft: `4px solid ${user.accentColor}` } : {}}
                  >
                    <span className="text-4xl">{user.avatar}</span>
                    <div>
                      <p className="font-bold text-lg">{user.name}</p>
                      <p className="text-text-muted text-sm capitalize">{user.role}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={wallDisplay}
                className="mt-4 w-full text-center text-text-muted text-sm py-3 hover:opacity-70"
              >
                📺 Wall Display Mode
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="pin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="card p-6"
            >
              <div className="text-center mb-4">
                <span className="text-5xl">{selected?.avatar}</span>
                <p className="font-bold text-xl mt-2">{selected?.name}</p>
              </div>
              <PinPad
                onSubmit={submitPin}
                onCancel={() => { setStep('select'); setError('') }}
                error={error}
                label="Enter your PIN"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
