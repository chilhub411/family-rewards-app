import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Star } from 'lucide-react'

interface Props {
  points: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
}

export function PointsBadge({ points, size = 'md', animate = true }: Props) {
  const prev = useRef(points)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (points !== prev.current) {
      setKey(k => k + 1)
      prev.current = points
    }
  }, [points])

  const sizes = {
    sm: 'text-sm gap-1',
    md: 'text-xl gap-1.5',
    lg: 'text-3xl gap-2',
    xl: 'text-5xl gap-3',
  }

  const iconSizes = { sm: 12, md: 18, lg: 24, xl: 36 }

  return (
    <div className={`flex items-center font-black ${sizes[size]}`} style={{ color: 'var(--accent)' }}>
      <Star fill="currentColor" size={iconSizes[size]} />
      <AnimatePresence mode="wait">
        {animate ? (
          <motion.span
            key={key}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {points.toLocaleString()}
          </motion.span>
        ) : (
          <span>{points.toLocaleString()}</span>
        )}
      </AnimatePresence>
    </div>
  )
}
