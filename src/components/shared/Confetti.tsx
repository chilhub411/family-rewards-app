import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  color: string
  delay: number
  size: number
}

const COLORS = ['#6366f1', '#a855f7', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4']

export function Confetti({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!trigger) return
    const ps: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.5,
      size: 6 + Math.random() * 8,
    }))
    setParticles(ps)
    const t = setTimeout(() => setParticles([]), 3000)
    return () => clearTimeout(t)
  }, [trigger])

  if (!particles.length) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: '2px',
            animation: `confetti-fall ${1.5 + Math.random()}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  )
}
