import { useState } from 'react'
import { motion } from 'framer-motion'
import { Delete } from 'lucide-react'

interface Props {
  onSubmit: (pin: string) => void
  onCancel?: () => void
  error?: string
  label?: string
}

export function PinPad({ onSubmit, onCancel, error, label = 'Enter PIN' }: Props) {
  const [digits, setDigits] = useState<string[]>([])

  const press = (d: string) => {
    if (digits.length >= 4) return
    const next = [...digits, d]
    setDigits(next)
    if (next.length === 4) {
      setTimeout(() => {
        onSubmit(next.join(''))
        setDigits([])
      }, 150)
    }
  }

  const del = () => setDigits(d => d.slice(0, -1))

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-lg font-semibold text-text-muted">{label}</p>

      <div className="flex gap-3">
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={i}
            animate={{ scale: digits.length > i ? 1.2 : 1 }}
            className={`w-4 h-4 rounded-full border-2 transition-colors ${
              digits.length > i ? 'bg-accent border-accent' : 'border-text-muted'
            }`}
          />
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ x: -10 }} animate={{ x: 0 }}
          className="text-red-400 text-sm font-medium"
        >
          {error}
        </motion.p>
      )}

      <div className="grid grid-cols-3 gap-3 w-64">
        {['1','2','3','4','5','6','7','8','9'].map(d => (
          <motion.button
            key={d}
            whileTap={{ scale: 0.9 }}
            onClick={() => press(d)}
            className="h-16 rounded-2xl text-2xl font-bold card hover:opacity-80 active:opacity-60 transition-opacity"
          >
            {d}
          </motion.button>
        ))}
        <div />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => press('0')}
          className="h-16 rounded-2xl text-2xl font-bold card hover:opacity-80"
        >
          0
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={del}
          className="h-16 rounded-2xl card flex items-center justify-center hover:opacity-80"
        >
          <Delete className="w-5 h-5 text-text-muted" />
        </motion.button>
      </div>

      {onCancel && (
        <button onClick={onCancel} className="text-text-muted text-sm underline">
          Cancel
        </button>
      )}
    </div>
  )
}
