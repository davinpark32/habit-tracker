import Pet from './Pet'
import GoalCard from './GoalCard'
import { useStore } from '../store'

const stickyHome = import.meta.env.VITE_STICKY_HOME === '1'

export default function Home({ onComplete, onAdd }) {
  const { today, goalsOn, streak, growthStage, candies, undoGoal, willCompleteDay, dayClearSeen } = useStore()
  const goals = goalsOn(today)
  function complete(goal) { onComplete({ goal, date: today, dayClear: willCompleteDay(goal.id, today) && !dayClearSeen[today] }) }

  return (
    <section className={stickyHome ? 'screen sticky-home' : 'screen'}>
      <div className="home-pin">
        <header className="topbar"><h1>오늘</h1><span className="candy-count">🍬 {candies.length}</span></header>
        <div className="hero home-hero"><Pet size={145} grown={growthStage} /><p className="streak">🔥 연속 달성 {streak}일</p></div>
        <div className="list-heading"><h2 className="list-title">오늘의 목표</h2><span>{goals.filter((goal) => goal.completed).length}/{goals.length}</span></div>
      </div>
      <div className="home-scroll">
        {goals.length === 0 && <div className="empty-state compact"><p>오늘은 설정된 목표가 없어요.</p></div>}
        <div className="cards home-cards">{goals.map((goal) => <GoalCard key={goal.id} goal={goal} onComplete={() => complete(goal)} onUndo={() => undoGoal(goal.id, today)} />)}</div>
        <div className="tab-clear" aria-hidden="true" />
      </div>
      <button className="fab" onClick={() => onAdd(today)} aria-label="목표 추가">+</button>
    </section>
  )
}
