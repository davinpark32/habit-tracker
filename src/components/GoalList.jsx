import { formatKoreanDate, useStore } from '../store'
import GoalCard from './GoalCard'

export default function GoalList({ date, onBack, onComplete, onEdit, onAdd }) {
  const { goalsOn, isPast, today, undoGoal, willCompleteDay, dayClearSeen } = useStore()
  const goals = goalsOn(date)
  const past = isPast(date)

  function complete(goal) { onComplete({ goal, date, dayClear: willCompleteDay(goal.id, date) && !dayClearSeen[date] }) }

  return (
    <section className="screen">
      <header className="topbar"><button className="icon-btn" onClick={onBack} aria-label="뒤로">←</button><h1>{formatKoreanDate(date)}</h1><span className="spacer" /></header>
      <div className="list-heading"><h2 className="list-title">{date === today ? '오늘의 목표' : '이 날의 목표'}</h2><span>{goals.filter((goal) => goal.completed).length}/{goals.length}</span></div>
      {goals.length === 0 && <div className="empty-state"><span>○</span><p>이 날에는 아직 목표가 없어요.</p></div>}
      <div className="cards">{goals.map((goal) => <GoalCard key={goal.id} goal={goal} locked={past} onComplete={() => complete(goal)} onUndo={() => undoGoal(goal.id, date)} onEdit={() => onEdit(goal)} />)}</div>
      <button className="fab" onClick={() => onAdd(date)} aria-label="목표 추가">+</button>
    </section>
  )
}
