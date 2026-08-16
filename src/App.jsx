import { useCallback, useState } from 'react'
import Calendar from './components/Calendar'
import CompleteOverlay from './components/CompleteOverlay'
import CreateGoal from './components/CreateGoal'
import GoalList from './components/GoalList'
import Home from './components/Home'
import PetScreen from './components/PetScreen'
import TabBar from './components/TabBar'
import { StoreProvider, todayKey } from './store'

export default function App() {
  return (
    <StoreProvider>
      <Phone />
    </StoreProvider>
  )
}

function Phone() {
  const [tab, setTab] = useState('calendar')
  const [view, setView] = useState('main')
  const [date, setDate] = useState(todayKey())
  const [completing, setCompleting] = useState(null)

  const finishComplete = useCallback(() => setCompleting(null), [])

  function openDate(nextDate) {
    setDate(nextDate)
    setView('list')
  }

  return (
    <div className="stage">
      <div className="phone">
        {view === 'main' && tab === 'today' && (
          <Home onOpenToday={() => openDate(todayKey())} />
        )}
        {view === 'main' && tab === 'calendar' && (
          <Calendar onSelectDate={openDate} onAdd={() => setView('create')} />
        )}
        {view === 'main' && tab === 'pet' && <PetScreen />}
        {view === 'list' && (
          <GoalList
            date={date}
            onBack={() => setView('main')}
            onComplete={setCompleting}
          />
        )}
        {view === 'create' && (
          <CreateGoal
            onBack={() => setView('main')}
            onSaved={(savedDate) => {
              setDate(savedDate)
              setTab('calendar')
              setView('list')
            }}
          />
        )}
        {view === 'main' && <TabBar tab={tab} onChange={setTab} />}
        {completing && (
          <CompleteOverlay goal={completing} onDone={finishComplete} />
        )}
      </div>
    </div>
  )
}
