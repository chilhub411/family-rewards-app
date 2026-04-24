import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { Check, X } from 'lucide-react'
import { Modal } from '../../components/shared/Modal'

type Tab = 'chores' | 'prizes' | 'transfers' | 'wishlist'

export function ParentApprovals() {
  const user = useAppStore(s => s.getCurrentUser())
  const users = useAppStore(s => s.users)
  const chores = useAppStore(s => s.chores)
  const choreInstances = useAppStore(s => s.choreInstances)
  const approveChore = useAppStore(s => s.approveChore)
  const denyChore = useAppStore(s => s.denyChore)

  const prizes = useAppStore(s => s.prizes)
  const redemptions = useAppStore(s => s.redemptions)
  const approveRedemption = useAppStore(s => s.approveRedemption)
  const denyRedemption = useAppStore(s => s.denyRedemption)
  const fulfillRedemption = useAppStore(s => s.fulfillRedemption)

  const transfers = useAppStore(s => s.transfers)
  const approveTransfer = useAppStore(s => s.approveTransfer)
  const denyTransfer = useAppStore(s => s.denyTransfer)

  const wishlist = useAppStore(s => s.wishlist)
  const updateWishlistStatus = useAppStore(s => s.updateWishlistStatus)

  const [tab, setTab] = useState<Tab>('chores')
  const [transferModal, setTransferModal] = useState<string | null>(null)
  const [bonus, setBonus] = useState(0)
  const [bonusReason, setBonusReason] = useState('')

  if (!user) return null

  const pendingChores = choreInstances.filter(ci => ci.status === 'submitted')
  const pendingRedemptions = redemptions.filter(r => r.status === 'pending')
  const approvedRedemptions = redemptions.filter(r => r.status === 'approved')
  const pendingTransfers = transfers.filter(t => t.status === 'pending')
  const pendingWishlist = wishlist.filter(w => w.status === 'submitted')

  const getUser = (id: string) => users.find(u => u.id === id)

  const pendingCount = {
    chores: pendingChores.length,
    prizes: pendingRedemptions.length,
    transfers: pendingTransfers.length,
    wishlist: pendingWishlist.length,
  }

  const totalPending = Object.values(pendingCount).reduce((a, b) => a + b, 0)

  const handleApproveTransfer = () => {
    if (!transferModal || !user) return
    approveTransfer(transferModal, user.id, bonus || undefined, bonusReason || undefined)
    setTransferModal(null)
    setBonus(0)
    setBonusReason('')
  }

  const selectedTransfer = transfers.find(t => t.id === transferModal)

  return (
    <div className="min-h-screen pb-24 pt-safe px-4">
      <div className="pt-4 mb-4">
        <h1 className="text-2xl font-black">
          Approvals {totalPending > 0 && (
            <span className="ml-2 bg-red-500 text-white text-sm rounded-full px-2 py-0.5">{totalPending}</span>
          )}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {(['chores', 'prizes', 'transfers', 'wishlist'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              tab === t ? 'text-white' : 'card text-text-muted'
            }`}
            style={tab === t ? { backgroundColor: 'var(--accent)' } : {}}
          >
            {t === 'chores' ? `✓ Chores ${pendingCount.chores > 0 ? `(${pendingCount.chores})` : ''}` :
             t === 'prizes' ? `🎁 Prizes ${pendingCount.prizes > 0 ? `(${pendingCount.prizes})` : ''}` :
             t === 'transfers' ? `💝 Transfers ${pendingCount.transfers > 0 ? `(${pendingCount.transfers})` : ''}` :
             `💫 Wishlist ${pendingCount.wishlist > 0 ? `(${pendingCount.wishlist})` : ''}`}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'chores' && (
          <motion.div key="chores" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {pendingChores.length === 0 ? (
              <EmptyState emoji="✅" message="No pending chore approvals" />
            ) : (
              <div className="grid gap-3">
                {pendingChores.map(ci => {
                  const chore = chores.find(c => c.id === ci.choreId)
                  const kid = getUser(ci.assignedTo)
                  if (!chore || !kid) return null
                  return (
                    <ApprovalCard
                      key={ci.id}
                      emoji={chore.emoji}
                      title={chore.name}
                      subtitle={`${kid.avatar} ${kid.name} · +${chore.pointValue} pts`}
                      accentColor={kid.accentColor}
                      note={ci.notes}
                      onApprove={() => approveChore(ci.id, user.id)}
                      onDeny={() => denyChore(ci.id)}
                    />
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'prizes' && (
          <motion.div key="prizes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
            {pendingRedemptions.length > 0 && (
              <>
                <p className="font-bold text-text-muted text-sm">Pending</p>
                {pendingRedemptions.map(r => {
                  const prize = prizes.find(p => p.id === r.prizeId)
                  const kid = getUser(r.userId)
                  if (!prize || !kid) return null
                  return (
                    <ApprovalCard
                      key={r.id}
                      emoji={prize.emoji}
                      title={prize.name}
                      subtitle={`${kid.avatar} ${kid.name} · ${r.costAtRedemption} pts`}
                      accentColor={kid.accentColor}
                      onApprove={() => approveRedemption(r.id, user.id)}
                      onDeny={() => denyRedemption(r.id)}
                    />
                  )
                })}
              </>
            )}
            {approvedRedemptions.length > 0 && (
              <>
                <p className="font-bold text-text-muted text-sm mt-2">Approved — needs fulfillment</p>
                {approvedRedemptions.map(r => {
                  const prize = prizes.find(p => p.id === r.prizeId)
                  const kid = getUser(r.userId)
                  if (!prize || !kid) return null
                  return (
                    <div key={r.id} className="card p-4 flex items-center gap-3">
                      <span className="text-3xl">{prize.emoji}</span>
                      <div className="flex-1">
                        <p className="font-bold">{prize.name}</p>
                        <p className="text-text-muted text-xs">{kid.avatar} {kid.name}</p>
                      </div>
                      <button
                        onClick={() => fulfillRedemption(r.id)}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        ✓ Fulfilled
                      </button>
                    </div>
                  )
                })}
              </>
            )}
            {pendingRedemptions.length === 0 && approvedRedemptions.length === 0 && (
              <EmptyState emoji="🎁" message="No prize redemptions to review" />
            )}
          </motion.div>
        )}

        {tab === 'transfers' && (
          <motion.div key="transfers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
            {pendingTransfers.length === 0 ? (
              <EmptyState emoji="💝" message="No pending transfers" />
            ) : (
              pendingTransfers.map(t => {
                const from = getUser(t.fromUserId)
                const to = getUser(t.toUserId)
                if (!from || !to) return null
                return (
                  <motion.div key={t.id} className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{from.avatar}</span>
                      <span className="font-bold">{from.name}</span>
                      <span className="text-text-muted">→</span>
                      <span className="text-2xl">{to.avatar}</span>
                      <span className="font-bold">{to.name}</span>
                    </div>
                    <p className="text-2xl font-black mb-1" style={{ color: 'var(--accent)' }}>
                      {t.emoji ?? '💝'} {t.amount} pts
                    </p>
                    {t.message && <p className="text-text-muted text-sm mb-3">"{t.message}"</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTransferModal(t.id)}
                        className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-1"
                        style={{ backgroundColor: '#22c55e' }}
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => denyTransfer(t.id)}
                        className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-1 bg-red-500"
                      >
                        <X className="w-4 h-4" /> Deny
                      </button>
                    </div>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        )}

        {tab === 'wishlist' && (
          <motion.div key="wishlist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
            {pendingWishlist.length === 0 ? (
              <EmptyState emoji="💫" message="No wishlist items to review" />
            ) : (
              pendingWishlist.map(w => {
                const kid = getUser(w.userId)
                if (!kid) return null
                return (
                  <div key={w.id} className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{kid.avatar}</span>
                      <span className="font-bold">{kid.name}</span>
                    </div>
                    <p className="font-bold mb-1">💫 {w.name}</p>
                    {w.notes && <p className="text-text-muted text-sm mb-3">{w.notes}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateWishlistStatus(w.id, 'approved')}
                        className="flex-1 py-2 rounded-xl font-bold text-white bg-green-500 text-sm"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => updateWishlistStatus(w.id, 'added_to_store')}
                        className="flex-1 py-2 rounded-xl font-bold text-white text-sm"
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        + Add to Store
                      </button>
                      <button
                        onClick={() => updateWishlistStatus(w.id, 'denied')}
                        className="flex-1 py-2 rounded-xl font-bold text-white bg-red-500 text-sm"
                      >
                        ✗ Deny
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer approve modal with bonus */}
      <Modal open={!!transferModal} onClose={() => { setTransferModal(null); setBonus(0); setBonusReason('') }} title="Approve Transfer">
        {selectedTransfer && (() => {
          const from = getUser(selectedTransfer.fromUserId)
          const to = getUser(selectedTransfer.toUserId)
          return (
            <div className="py-2 grid gap-4">
              <div className="card p-4 text-center">
                <p className="text-4xl mb-2">{selectedTransfer.emoji ?? '💝'} {selectedTransfer.amount} pts</p>
                <p className="text-text-muted">
                  {from?.name} → {to?.name}
                </p>
                {selectedTransfer.message && <p className="text-sm mt-2">"{selectedTransfer.message}"</p>}
              </div>

              <div>
                <p className="font-semibold mb-2">Bonus for {from?.name}? (optional)</p>
                <div className="flex gap-2 mb-2">
                  {[0, 10, 25, 50].map(a => (
                    <button
                      key={a}
                      onClick={() => setBonus(a)}
                      className={`flex-1 py-2 rounded-xl font-bold text-sm ${bonus === a ? 'text-white' : 'card text-text-muted'}`}
                      style={bonus === a ? { backgroundColor: 'var(--accent)' } : {}}
                    >
                      {a === 0 ? 'None' : `+${a}`}
                    </button>
                  ))}
                </div>
                {bonus > 0 && (
                  <input
                    value={bonusReason}
                    onChange={e => setBonusReason(e.target.value)}
                    placeholder="Reason for bonus..."
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm"
                  />
                )}
              </div>

              <button
                onClick={handleApproveTransfer}
                className="w-full py-4 rounded-2xl font-bold text-white text-lg"
                style={{ backgroundColor: '#22c55e' }}
              >
                ✓ Approve Transfer
              </button>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

function ApprovalCard({ emoji, title, subtitle, accentColor, note, onApprove, onDeny }: {
  emoji: string; title: string; subtitle: string; accentColor?: string; note?: string;
  onApprove: () => void; onDeny: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="card p-4"
      style={accentColor ? { borderLeft: `4px solid ${accentColor}` } : {}}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{emoji}</span>
        <div className="flex-1">
          <p className="font-bold">{title}</p>
          <p className="text-text-muted text-xs">{subtitle}</p>
          {note && <p className="text-sm mt-1 italic">"{note}"</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-1 bg-green-500"
        >
          <Check className="w-4 h-4" /> Approve
        </button>
        <button
          onClick={onDeny}
          className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-1 bg-red-500"
        >
          <X className="w-4 h-4" /> Deny
        </button>
      </div>
    </motion.div>
  )
}

function EmptyState({ emoji, message }: { emoji: string; message: string }) {
  return (
    <div className="card p-10 text-center">
      <p className="text-4xl mb-2">{emoji}</p>
      <p className="text-text-muted">{message}</p>
    </div>
  )
}
