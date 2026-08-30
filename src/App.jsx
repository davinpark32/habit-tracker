import { useCallback, useState } from 'react'
import Calendar from './components/Calendar'
import CompleteOverlay from './components/CompleteOverlay'
import CreateGoal from './components/CreateGoal'
import GoalList from './components/GoalList'
import Home from './components/Home'
import PetScreen from './components/PetScreen'
import TabBar from './components/TabBar'
import { StoreProvider, todayKey } from './store'
import './improvements.css'

export default function App() {
  return (
    <StoreProvider>
      <Phone />
    </StoreProvider>
  )
}

function Phone() {
  const [tab, setTab] = useState('today')
  const [view, setView] = useState('main')
  const [date, setDate] = useState(todayKey())
  const [completing, setCompleting] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)
  const [returnAfterCreate, setReturnAfterCreate] = useState({ tab: 'today', view: 'main' })

  const finishComplete = useCallback(() => setCompleting(null), [])

  function openDate(nextDate) {
    setDate(nextDate)
    setView('list')
  }

  function openCreate(initialDate = todayKey(), returnTo = { tab: 'today', view: 'main' }) {
    setDate(initialDate)
    setEditingGoal(null)
    setReturnAfterCreate(returnTo)
    setView('create')
  }

  function openEdit(goal) {
    setEditingGoal(goal)
    setReturnAfterCreate({ tab: 'calendar', view: 'list' })
    setView('create')
  }

  return (
    <div className="stage">
      <div className="phone">
        {view === 'main' && tab === 'today' && (
          <Home
            onComplete={setCompleting}
            onAdd={() => openCreate(todayKey(), { tab: 'today', view: 'main' })}
            onOpenDate={() => openDate(todayKey())}
          />
        )}
        {view === 'main' && tab === 'calendar' && (
          <Calendar
            onSelectDate={openDate}
            onAdd={() => openCreate(date, { tab: 'calendar', view: 'main' })}
          />
        )}
        {view === 'main' && tab === 'pet' && <PetScreen />}
        {view === 'list' && (
          <GoalList
            date={date}
            onBack={() => setView('main')}
            onComplete={setCompleting}
            onEdit={openEdit}
            onAdd={(targetDate) => openCreate(targetDate, { tab: 'calendar', view: 'list' })}
          />
        )}
        {view === 'create' && (
          <CreateGoal
            key={editingGoal?.id ?? `new-${date}`}
            editingGoal={editingGoal}
            initialDate={date}
            onBack={() => setView(returnAfterCreate.view === 'list' ? 'list' : 'main')}
            onSaved={(savedDate) => {
              setDate(savedDate)
              setEditingGoal(null)
              setTab(returnAfterCreate.tab)
              setView(returnAfterCreate.view)
            }}
          />
        )}
        {view === 'main' && <TabBar tab={tab} onChange={setTab} />}
        {completing && <CompleteOverlay completion={completing} onDone={finishComplete} />}
      </div>
    </div>
  )
}
