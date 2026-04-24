import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../stores/appStore'
import { hashPin } from '../utils/crypto'
import { ChevronRight, Sparkles, Users, Zap } from 'lucide-react'

type Step = 'welcome' | 'demo' | 'done'

const AVATARS = ['🦋', '⚡', '🦊', '🐉', '🌟', '🦁', '🐧', '🦄', '🚀', '🎸', '🌺', '🐬']
const COLORS = ['#6366f1', '#a855f7', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#84cc16']

export function SetupWizard() {
  const navigate = useNavigate()
  const seedDemoData = useAppStore(s => s.seedDemoData)
  const addUser = useAppStore(s => s.addUser)
  const addPrize = useAppStore(s => s.addPrize)
  const addChore = useAppStore(s => s.addChore)
  const generateChoreInstances = useAppStore(s => s.generateChoreInstances)
  const completeSetup = useAppStore(s => s.completeSetup)
  const setupComplete = useAppStore(s => s.setupComplete)

  const [step, setStep] = useState<Step>('welcome')

  if (setupComplete) {
    navigate('/', { replace: true })
    return null
  }

  const useDemoData = () => {
    seedDemoData()
    navigate('/', { replace: true })
  }

  const startFresh = () => setStep('done')

  const finishSetup = () => {
    completeSetup()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-20 dark:opacity-40" />

      <div className="relative z-10 w-full max-w-sm">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-7xl mb-4"
              >
                ⭐
              </motion.div>
              <h1 className="text-4xl font-black mb-2" style={{ color: 'var(--accent)' }}>Welcome to Kudos!</h1>
              <p className="text-text-muted mb-8 text-lg">
                The family rewards app that makes chores fun and teaches kids about goals.
              </p>

              <div className="grid gap-4">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={useDemoData}
                  className="card p-5 text-left hover:opacity-90 transition-all"
                  style={{ borderLeft: '4px solid var(--accent)' }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                    <span className="font-bold text-lg">Quick Start</span>
                  </div>
                  <p className="text-text-muted text-sm">Load demo data with Layla & Jack, sample chores, and prizes. Edit everything after.</p>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={startFresh}
                  className="card p-5 text-left hover:opacity-90 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-text-muted" />
                    <span className="font-bold text-lg">Start Fresh</span>
                  </div>
                  <p className="text-text-muted text-sm">Set up your family from scratch with your own names and settings.</p>
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center card p-8"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-black mb-2">You're all set!</h2>
              <p className="text-text-muted mb-6">
                You can add family members, chores, and prizes from the Parent dashboard → Manage section.
              </p>
              <p className="text-sm text-text-muted mb-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                💡 First, add a parent account from Manage → Family, then log in as parent to add your kids.
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={finishSetup}
                className="w-full py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Let's Go! <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
