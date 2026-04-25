import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'
import { Modal } from '../../components/shared/Modal'
import { Plus, Edit2, Trash2, ChevronRight } from 'lucide-react'
import { hashPin } from '../../utils/crypto'
import type { Chore, Prize, PrizeCategory, ChoreFrequency } from '../../types'

type Tab = 'family' | 'chores' | 'prizes' | 'activities'

const AVATARS = ['🦋', '⚡', '🦊', '🐉', '🌟', '🦁', '🐧', '🦄', '🚀', '🎸', '🌺', '🐬', '🧑‍💼', '👩‍💼', '🧑‍🎨']
const COLORS = ['#6366f1', '#a855f7', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#ef4444']

export function ParentManage() {
  const user = useAppStore(s => s.getCurrentUser())
  const users = useAppStore(s => s.users)
  const addUser = useAppStore(s => s.addUser)
  const updateUser = useAppStore(s => s.updateUser)
  const archiveUser = useAppStore(s => s.archiveUser)

  const chores = useAppStore(s => s.chores)
  const addChore = useAppStore(s => s.addChore)
  const updateChore = useAppStore(s => s.updateChore)
  const deleteChore = useAppStore(s => s.deleteChore)

  const prizes = useAppStore(s => s.prizes)
  const addPrize = useAppStore(s => s.addPrize)
  const updatePrize = useAppStore(s => s.updatePrize)
  const deletePrize = useAppStore(s => s.deletePrize)

  const activities = useAppStore(s => s.activities)
  const addActivity = useAppStore(s => s.addActivity)
  const deleteActivity = useAppStore(s => s.deleteActivity)

  const [tab, setTab] = useState<Tab>('family')
  const [userModal, setUserModal] = useState(false)
  const [choreModal, setChoreModal] = useState(false)
  const [prizeModal, setPrizeModal] = useState(false)
  const [activityModal, setActivityModal] = useState(false)

  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editingChore, setEditingChore] = useState<string | null>(null)
  const [editingPrize, setEditingPrize] = useState<string | null>(null)

  // User form
  const [uName, setUName] = useState('')
  const [uRole, setURole] = useState<'kid' | 'parent'>('kid')
  const [uAge, setUAge] = useState('')
  const [uAvatar, setUAvatar] = useState('🦋')
  const [uColor, setUColor] = useState('#6366f1')
  const [uPin, setUPin] = useState('')

  // Chore form
  const [cName, setCName] = useState('')
  const [cEmoji, setCEmoji] = useState('✨')
  const [cPoints, setCPoints] = useState('10')
  const [cAssigned, setCAssigned] = useState<string[]>([])
  const [cFrequency, setCFrequency] = useState<ChoreFrequency>('daily')
  const [cApproval, setCApproval] = useState(false)

  // Prize form
  const [pName, setPName] = useState('')
  const [pEmoji, setPEmoji] = useState('🎁')
  const [pCost, setPCost] = useState('20')
  const [pCategory, setPCategory] = useState<PrizeCategory>('screen_time')
  const [pLimit, setPLimit] = useState<Prize['limitType']>('none')

  // Activity form
  const [aTitle, setATitle] = useState('')
  const [aEmoji, setAEmoji] = useState('📅')
  const [aAssigned, setAAssigned] = useState<string[]>([])
  const [aStart, setAStart] = useState('')
  const [aEnd, setAEnd] = useState('')
  const [aLocation, setALocation] = useState('')

  if (!user) return null

  const kids = users.filter(u => u.role === 'kid' && !u.archived)

  const resetUserForm = () => { setUName(''); setURole('kid'); setUAge(''); setUAvatar('🦋'); setUColor('#6366f1'); setUPin('') }
  const resetChoreForm = () => { setCName(''); setCEmoji('✨'); setCPoints('10'); setCAssigned([]); setCFrequency('daily'); setCApproval(false) }
  const resetPrizeForm = () => { setPName(''); setPEmoji('🎁'); setPCost('20'); setPCategory('screen_time'); setPLimit('none') }
  const resetActivityForm = () => { setATitle(''); setAEmoji('📅'); setAAssigned([]); setAStart(''); setAEnd(''); setALocation('') }

  const openAddUser = () => { resetUserForm(); setEditingUser(null); setUserModal(true) }
  const openEditUser = (id: string) => {
    const u = users.find(u => u.id === id)
    if (!u) return
    setUName(u.name); setURole(u.role as 'kid' | 'parent'); setUAge(u.age?.toString() ?? '');
    setUAvatar(u.avatar); setUColor(u.accentColor); setUPin('')
    setEditingUser(id); setUserModal(true)
  }

  const saveUser = () => {
    if (!uName.trim()) return
    if (editingUser) {
      updateUser(editingUser, { name: uName, avatar: uAvatar, accentColor: uColor, age: uAge ? parseInt(uAge) : undefined })
      if (uPin) updateUser(editingUser, { pinHash: hashPin(uPin) })
    } else {
      addUser({
        name: uName.trim(),
        role: uRole,
        age: uAge ? parseInt(uAge) : undefined,
        avatar: uAvatar,
        accentColor: uColor,
        themePreference: 'auto',
        pinHash: hashPin(uPin || '0000'),
      })
    }
    setUserModal(false)
  }

  const openAddChore = () => { resetChoreForm(); setEditingChore(null); setChoreModal(true) }
  const openEditChore = (id: string) => {
    const c = chores.find(c => c.id === id)
    if (!c) return
    setCName(c.name); setCEmoji(c.emoji); setCPoints(c.pointValue.toString());
    setCAssigned(c.assignedTo); setCFrequency(c.frequency); setCApproval(c.requiresApproval)
    setEditingChore(id); setChoreModal(true)
  }

  const saveChore = () => {
    if (!cName.trim()) return
    const data = { name: cName.trim(), emoji: cEmoji, pointValue: parseInt(cPoints) || 10, assignedTo: cAssigned, frequency: cFrequency, requiresApproval: cApproval, autoDeductIfMissed: false, active: true }
    if (editingChore) updateChore(editingChore, data)
    else addChore(data)
    setChoreModal(false)
  }

  const openAddPrize = () => { resetPrizeForm(); setEditingPrize(null); setPrizeModal(true) }
  const openEditPrize = (id: string) => {
    const p = prizes.find(p => p.id === id)
    if (!p) return
    setPName(p.name); setPEmoji(p.emoji); setPCost(p.cost.toString()); setPCategory(p.category); setPLimit(p.limitType)
    setEditingPrize(id); setPrizeModal(true)
  }

  const savePrize = () => {
    if (!pName.trim()) return
    const data = { name: pName.trim(), emoji: pEmoji, cost: parseInt(pCost) || 20, category: pCategory, limitType: pLimit, active: true }
    if (editingPrize) updatePrize(editingPrize, data)
    else addPrize(data)
    setPrizeModal(false)
  }

  const saveActivity = () => {
    if (!aTitle.trim() || !aStart) return
    addActivity({ title: aTitle.trim(), emoji: aEmoji, assignedTo: aAssigned, start: aStart, end: aEnd || undefined, location: aLocation || undefined })
    setActivityModal(false)
    resetActivityForm()
  }

  const toggleAssigned = (userId: string, current: string[], setter: (v: string[]) => void) => {
    setter(current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId])
  }

  return (
    <div className="min-h-screen pb-24 pt-safe px-4">
      <div className="pt-4 mb-4">
        <h1 className="text-2xl font-black">Manage</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {(['family', 'chores', 'prizes', 'activities'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm capitalize ${
              tab === t ? 'text-white' : 'card text-text-muted'
            }`}
            style={tab === t ? { backgroundColor: 'var(--accent)' } : {}}
          >
            {t === 'family' ? '👨‍👩‍👧‍👦 Family' : t === 'chores' ? '✅ Chores' : t === 'prizes' ? '🎁 Prizes' : '📅 Activities'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'family' && (
          <motion.div key="family" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
            <button onClick={openAddUser} className="card p-4 flex items-center gap-3 text-accent font-bold hover:opacity-90">
              <Plus className="w-5 h-5" /> Add Family Member
            </button>
            {users.filter(u => !u.archived).map(u => (
              <div key={u.id} className="card p-4 flex items-center gap-3" style={{ borderLeft: `4px solid ${u.accentColor}` }}>
                <span className="text-3xl">{u.avatar}</span>
                <div className="flex-1">
                  <p className="font-bold">{u.name}</p>
                  <p className="text-text-muted text-xs capitalize">{u.role}{u.age ? ` · Age ${u.age}` : ''}</p>
                </div>
                <button onClick={() => openEditUser(u.id)} className="p-2 text-text-muted hover:opacity-70"><Edit2 className="w-4 h-4" /></button>
                {u.id !== user.id && (
                  <button onClick={() => archiveUser(u.id, user.id)} className="p-2 text-text-muted hover:opacity-70"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {tab === 'chores' && (
          <motion.div key="chores" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
            <button onClick={openAddChore} className="card p-4 flex items-center gap-3 text-accent font-bold hover:opacity-90">
              <Plus className="w-5 h-5" /> Add Chore
            </button>
            {chores.filter(c => c.active).map(c => (
              <div key={c.id} className="card p-4 flex items-center gap-3">
                <span className="text-3xl">{c.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold">{c.name}</p>
                  <p className="text-text-muted text-xs">+{c.pointValue} pts · {c.frequency} · {c.assignedTo.map(id => users.find(u => u.id === id)?.name).join(', ')}</p>
                </div>
                <button onClick={() => openEditChore(c.id)} className="p-2 text-text-muted hover:opacity-70"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteChore(c.id)} className="p-2 text-text-muted hover:opacity-70"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </motion.div>
        )}

        {tab === 'prizes' && (
          <motion.div key="prizes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
            <button onClick={openAddPrize} className="card p-4 flex items-center gap-3 text-accent font-bold hover:opacity-90">
              <Plus className="w-5 h-5" /> Add Prize
            </button>
            {prizes.filter(p => p.active).map(p => (
              <div key={p.id} className="card p-4 flex items-center gap-3">
                <span className="text-3xl">{p.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold">{p.name}</p>
                  <p className="text-text-muted text-xs">{p.cost} pts · {p.category} · {p.limitType}</p>
                </div>
                <button onClick={() => openEditPrize(p.id)} className="p-2 text-text-muted hover:opacity-70"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deletePrize(p.id)} className="p-2 text-text-muted hover:opacity-70"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </motion.div>
        )}

        {tab === 'activities' && (
          <motion.div key="activities" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
            <button onClick={() => { resetActivityForm(); setActivityModal(true) }} className="card p-4 flex items-center gap-3 text-accent font-bold hover:opacity-90">
              <Plus className="w-5 h-5" /> Add Activity
            </button>
            {activities.map(a => (
              <div key={a.id} className="card p-4 flex items-center gap-3">
                <span className="text-3xl">{a.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold">{a.title}</p>
                  <p className="text-text-muted text-xs">
                    {a.start.split('T')[0]} {a.location ? `· ${a.location}` : ''}
                  </p>
                </div>
                <button onClick={() => deleteActivity(a.id)} className="p-2 text-text-muted hover:opacity-70"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit User Modal */}
      <Modal open={userModal} onClose={() => setUserModal(false)} title={editingUser ? 'Edit Member' : 'Add Family Member'}>
        <div className="grid gap-4 py-2">
          <div className="flex gap-2">
            <button onClick={() => setURole('kid')} className={`flex-1 py-2 rounded-xl font-bold ${uRole === 'kid' ? 'text-white' : 'card text-text-muted'}`} style={uRole === 'kid' ? { backgroundColor: 'var(--accent)' } : {}}>Kid</button>
            <button onClick={() => setURole('parent')} className={`flex-1 py-2 rounded-xl font-bold ${uRole === 'parent' ? 'text-white' : 'card text-text-muted'}`} style={uRole === 'parent' ? { backgroundColor: 'var(--accent)' } : {}}>Parent</button>
          </div>
          <input value={uName} onChange={e => setUName(e.target.value)} placeholder="Name" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent" />
          {uRole === 'kid' && (
            <input value={uAge} onChange={e => setUAge(e.target.value)} placeholder="Age (optional)" type="number" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent" />
          )}
          <div>
            <p className="text-sm text-text-muted mb-2">Avatar</p>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map(a => (
                <button key={a} onClick={() => setUAvatar(a)} className={`text-2xl p-2 rounded-xl ${uAvatar === a ? 'ring-2 ring-accent' : 'card'}`}>{a}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-text-muted mb-2">Accent Color</p>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setUColor(c)} className={`w-8 h-8 rounded-full ${uColor === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <input value={uPin} onChange={e => setUPin(e.target.value.slice(0, 4))} placeholder={editingUser ? 'New PIN (leave blank to keep)' : 'PIN (4 digits)'} type="number" maxLength={4} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent" />
          <button onClick={saveUser} className="w-full py-4 rounded-2xl font-bold text-white" style={{ backgroundColor: 'var(--accent)' }}>
            {editingUser ? 'Save Changes' : 'Add Member'}
          </button>
        </div>
      </Modal>

      {/* Add/Edit Chore Modal */}
      <Modal open={choreModal} onClose={() => setChoreModal(false)} title={editingChore ? 'Edit Chore' : 'Add Chore'}>
        <div className="grid gap-4 py-2">
          <div className="flex gap-2">
            <input value={cEmoji} onChange={e => setCEmoji(e.target.value)} placeholder="Emoji" className="w-16 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-center text-xl" />
            <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Chore name" className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent" />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm text-text-muted">Points:</label>
            <input value={cPoints} onChange={e => setCPoints(e.target.value)} type="number" className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent" />
          </div>
          <div>
            <p className="text-sm text-text-muted mb-2">Frequency</p>
            <div className="flex gap-2">
              {(['once', 'daily', 'weekly'] as ChoreFrequency[]).map(f => (
                <button key={f} onClick={() => setCFrequency(f)} className={`flex-1 py-2 rounded-xl font-semibold text-sm capitalize ${cFrequency === f ? 'text-white' : 'card text-text-muted'}`} style={cFrequency === f ? { backgroundColor: 'var(--accent)' } : {}}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-text-muted mb-2">Assigned To</p>
            <div className="flex gap-2 flex-wrap">
              {kids.map(k => (
                <button key={k.id} onClick={() => toggleAssigned(k.id, cAssigned, setCAssigned)} className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold ${cAssigned.includes(k.id) ? 'text-white' : 'card text-text-muted'}`} style={cAssigned.includes(k.id) ? { backgroundColor: k.accentColor } : {}}>
                  {k.avatar} {k.name}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 card p-3 cursor-pointer">
            <input type="checkbox" checked={cApproval} onChange={e => setCApproval(e.target.checked)} className="w-4 h-4" />
            <span className="font-semibold">Requires parent approval</span>
          </label>
          <button onClick={saveChore} className="w-full py-4 rounded-2xl font-bold text-white" style={{ backgroundColor: 'var(--accent)' }}>
            {editingChore ? 'Save Chore' : 'Add Chore'}
          </button>
        </div>
      </Modal>

      {/* Add/Edit Prize Modal */}
      <Modal open={prizeModal} onClose={() => setPrizeModal(false)} title={editingPrize ? 'Edit Prize' : 'Add Prize'}>
        <div className="grid gap-4 py-2">
          <div className="flex gap-2">
            <input value={pEmoji} onChange={e => setPEmoji(e.target.value)} placeholder="Emoji" className="w-16 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-center text-xl" />
            <input value={pName} onChange={e => setPName(e.target.value)} placeholder="Prize name" className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent" />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm text-text-muted">Cost (pts):</label>
            <input value={pCost} onChange={e => setPCost(e.target.value)} type="number" className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent" />
          </div>
          <div>
            <p className="text-sm text-text-muted mb-2">Category</p>
            <div className="grid grid-cols-2 gap-2">
              {(['screen_time', 'physical', 'outing', 'privilege'] as PrizeCategory[]).map(c => (
                <button key={c} onClick={() => setPCategory(c)} className={`py-2 rounded-xl font-semibold text-xs ${pCategory === c ? 'text-white' : 'card text-text-muted'}`} style={pCategory === c ? { backgroundColor: 'var(--accent)' } : {}}>
                  {c === 'screen_time' ? '📺 Screen Time' : c === 'physical' ? '🎁 Physical' : c === 'outing' ? '🚗 Outing' : '✨ Privilege'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-text-muted mb-2">Limit</p>
            <div className="grid grid-cols-2 gap-2">
              {(['none', 'daily', 'weekly', 'once_ever'] as Prize['limitType'][]).map(l => (
                <button key={l} onClick={() => setPLimit(l)} className={`py-2 rounded-xl font-semibold text-xs capitalize ${pLimit === l ? 'text-white' : 'card text-text-muted'}`} style={pLimit === l ? { backgroundColor: 'var(--accent)' } : {}}>
                  {l === 'none' ? 'No limit' : l === 'once_ever' ? 'Once ever' : l}
                </button>
              ))}
            </div>
          </div>
          <button onClick={savePrize} className="w-full py-4 rounded-2xl font-bold text-white" style={{ backgroundColor: 'var(--accent)' }}>
            {editingPrize ? 'Save Prize' : 'Add Prize'}
          </button>
        </div>
      </Modal>

      {/* Add Activity Modal */}
      <Modal open={activityModal} onClose={() => setActivityModal(false)} title="Add Activity">
        <div className="grid gap-4 py-2">
          <div className="flex gap-2">
            <input value={aEmoji} onChange={e => setAEmoji(e.target.value)} placeholder="Emoji" className="w-16 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-center text-xl" />
            <input value={aTitle} onChange={e => setATitle(e.target.value)} placeholder="Activity title" className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent" />
          </div>
          <div>
            <p className="text-sm text-text-muted mb-2">For</p>
            <div className="flex gap-2">
              {kids.map(k => (
                <button key={k.id} onClick={() => toggleAssigned(k.id, aAssigned, setAAssigned)} className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold ${aAssigned.includes(k.id) ? 'text-white' : 'card text-text-muted'}`} style={aAssigned.includes(k.id) ? { backgroundColor: k.accentColor } : {}}>
                  {k.avatar} {k.name}
                </button>
              ))}
              <button onClick={() => setAAssigned(kids.map(k => k.id))} className="px-3 py-2 rounded-xl text-sm font-bold card text-text-muted">All</button>
            </div>
          </div>
          <input value={aStart} onChange={e => setAStart(e.target.value)} type="datetime-local" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent" />
          <input value={aEnd} onChange={e => setAEnd(e.target.value)} type="datetime-local" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent" placeholder="End time (optional)" />
          <input value={aLocation} onChange={e => setALocation(e.target.value)} placeholder="Location (optional)" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent" />
          <button onClick={saveActivity} className="w-full py-4 rounded-2xl font-bold text-white" style={{ backgroundColor: 'var(--accent)' }}>Add Activity</button>
        </div>
      </Modal>
    </div>
  )
}
