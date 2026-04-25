import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { PointsBadge } from '../../components/shared/PointsBadge'
import { Modal } from '../../components/shared/Modal'
import { Confetti } from '../../components/shared/Confetti'
import { Plus } from 'lucide-react'

const CATEGORY_LABELS = {
  screen_time: '📺 Screen Time',
  physical: '🎁 Physical',
  outing: '🚗 Outing',
  privilege: '✨ Privilege',
}

export function KidPrizes() {
  const user = useAppStore(s => s.getCurrentUser())
  const prizes = useAppStore(s => s.prizes.filter(p => p.active))
  const redemptions = useAppStore(s => s.redemptions)
  const getUserPoints = useAppStore(s => s.getUserPoints)
  const redeemPrize = useAppStore(s => s.redeemPrize)
  const wishlist = useAppStore(s => s.wishlist)
  const addWishlistItem = useAppStore(s => s.addWishlistItem)

  const [selectedPrize, setSelectedPrize] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [wishOpen, setWishOpen] = useState(false)
  const [wishName, setWishName] = useState('')
  const [wishNote, setWishNote] = useState('')
  const [tab, setTab] = useState<'store' | 'history' | 'wishlist'>('store')

  if (!user) return null

  const points = getUserPoints(user.id)
  const myRedemptions = redemptions.filter(r => r.userId === user.id).reverse()
  const myWishlist = wishlist.filter(w => w.userId === user.id)

  const handleRedeem = () => {
    if (!selectedPrize) return
    redeemPrize(user.id, selectedPrize)
    setConfirmOpen(false)
    setSelectedPrize(null)
    setConfetti(true)
    setTimeout(() => setConfetti(false), 3000)
  }

  const submitWish = () => {
    if (!wishName.trim()) return
    addWishlistItem(user.id, wishName.trim(), wishNote.trim() || undefined)
    setWishName('')
    setWishNote('')
    setWishOpen(false)
  }

  const prize = prizes.find(p => p.id === selectedPrize)

  const categories = [...new Set(prizes.map(p => p.category))]

  return (
    <div className="min-h-screen pb-24 pt-safe px-4">
      <Confetti trigger={confetti} />

      <div className="pt-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-black">Prize Store</h1>
          <PointsBadge points={points} size="sm" />
        </div>

        <div className="flex gap-2">
          {(['store', 'history', 'wishlist'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                tab === t ? 'text-white' : 'card text-text-muted'
              }`}
              style={tab === t ? { backgroundColor: 'var(--accent)' } : {}}
            >
              {t === 'store' ? '🏪 Store' : t === 'history' ? '📜 History' : '💫 Wishlist'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'store' && (
        <div>
          {categories.map(cat => (
            <div key={cat} className="mb-5">
              <p className="font-bold text-text-muted text-sm mb-2">{CATEGORY_LABELS[cat]}</p>
              <div className="grid gap-3">
                {prizes.filter(p => p.category === cat).map(p => {
                  const canAfford = points >= p.cost
                  return (
                    <motion.button
                      key={p.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setSelectedPrize(p.id); setConfirmOpen(true) }}
                      disabled={!canAfford}
                      className={`card p-4 flex items-center gap-3 text-left w-full transition-all ${
                        canAfford ? 'hover:opacity-90' : 'opacity-50'
                      }`}
                    >
                      <span className="text-4xl">{p.emoji}</span>
                      <div className="flex-1">
                        <p className="font-bold">{p.name}</p>
                        <PointsBadge points={p.cost} size="sm" />
                      </div>
                      {canAfford && (
                        <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-bold px-2 py-1 rounded-lg">
                          Can Redeem!
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="grid gap-3">
          {myRedemptions.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-4xl mb-2">🎁</p>
              <p className="text-text-muted">No redemptions yet — start spending!</p>
            </div>
          ) : (
            myRedemptions.map(r => {
              const p = prizes.find(pr => pr.id === r.prizeId)
              return (
                <div key={r.id} className="card p-4 flex items-center gap-3">
                  <span className="text-3xl">{p?.emoji ?? '🎁'}</span>
                  <div className="flex-1">
                    <p className="font-bold">{p?.name ?? 'Prize'}</p>
                    <p className="text-text-muted text-xs">-{r.costAtRedemption} pts</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    r.status === 'fulfilled' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    r.status === 'approved' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                    r.status === 'denied' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                  }`}>
                    {r.status}
                  </span>
                </div>
              )
            })
          )}
        </div>
      )}

      {tab === 'wishlist' && (
        <div>
          <button
            onClick={() => setWishOpen(true)}
            className="card w-full p-4 flex items-center gap-2 text-accent font-bold mb-4 hover:opacity-90"
          >
            <Plus className="w-5 h-5" /> Add to Wishlist
          </button>
          <div className="grid gap-3">
            {myWishlist.map(w => (
              <div key={w.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold">💫 {w.name}</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    w.status === 'added_to_store' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    w.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                    w.status === 'denied' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                  }`}>
                    {w.status === 'submitted' ? 'Pending' : w.status === 'added_to_store' ? 'In Store!' : w.status}
                  </span>
                </div>
                {w.notes && <p className="text-text-muted text-sm mt-1">{w.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Redeem confirm */}
      <Modal open={confirmOpen} onClose={() => { setConfirmOpen(false); setSelectedPrize(null) }} title="Redeem Prize">
        {prize && (
          <div className="py-4 text-center">
            <span className="text-6xl">{prize.emoji}</span>
            <h3 className="text-2xl font-black mt-3 mb-1">{prize.name}</h3>
            <PointsBadge points={prize.cost} size="md" />
            <p className="text-text-muted text-sm mt-2 mb-6">
              Your parents will need to approve this. Your points won't be deducted until they do.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleRedeem}
              className="w-full py-4 rounded-2xl font-bold text-white text-lg mb-3"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              🎉 Yes, Redeem!
            </motion.button>
            <button onClick={() => { setConfirmOpen(false); setSelectedPrize(null) }} className="text-text-muted">
              Cancel
            </button>
          </div>
        )}
      </Modal>

      {/* Wishlist modal */}
      <Modal open={wishOpen} onClose={() => setWishOpen(false)} title="Add to Wishlist">
        <div className="py-2 grid gap-4">
          <input
            value={wishName}
            onChange={e => setWishName(e.target.value)}
            placeholder="What do you want? 💭"
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent"
          />
          <textarea
            value={wishNote}
            onChange={e => setWishNote(e.target.value)}
            placeholder="Why do you want it? (optional)"
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent resize-none h-20"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={submitWish}
            className="w-full py-4 rounded-2xl font-bold text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Submit Wish ✨
          </motion.button>
        </div>
      </Modal>
    </div>
  )
}
