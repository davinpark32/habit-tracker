import { useRef, useState } from 'react'
import { formatKoreanDate, useStore } from '../store'

const HOLD_MS = 900

export default function GoalList({ date, onBack, onComplete }) {
  const { goalsOn, isPast, today } = useStore()
  const goals = goalsOn(date)
  const open = goals.filter((g) => !g.completed)
  const done = goals.filter((g) => g.completed)
  const past = isPast(date)
  const title = date === today ? '오늘의 목표' : '이 날의 목표'

  return (
    <section className="screen">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="뒤로">
          ←
        </button>
        <h1>{formatKoreanDate(date)}</h1>
        <span className="spacer" />
      </header>
      <h2 className="list-title">{title}</h2>
      {open.length === 0 && done.length === 0 && (
        <p className="empty">아직 목표가 없어요. 캘린더에서 + 로 추가해 보세요.</p>
      )}
      <div className="cards">
        {open.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            locked={past}
            onComplete={() => onComplete(goal)}
          />
        ))}
      </div>
      {done.length > 0 && (
        <>
          <h3 className="done-title">완료한 목표</h3>
          <ul className="done-list">
            {done.map((goal) => (
              <li key={goal.id}>✓ 완료 · {goal.title}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function GoalCard({ goal, locked, onComplete }) {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const frame = useRef(0)
  const start = useRef(0)

  function stop(success) {
    cancelAnimationFrame(frame.current)
    setHolding(false)
    if (success) {
      setProgress(1)
      onComplete()
    } else {
      setProgress(0)
    }
  }

  function tick(now) {
    const ratio = Math.min(1, (now - start.current) / HOLD_MS)
    setProgress(ratio)
    if (ratio >= 1) {
      stop(true)
      return
    }
    frame.current = requestAnimationFrame(tick)
  }

  function begin(event) {
    if (locked) return
    event.preventDefault()
    setHolding(true)
    start.current = performance.now()
    frame.current = requestAnimationFrame(tick)
  }

  function cancel() {
    if (holding) stop(false)
  }

  return (
    <button
      className={`goal-card ${holding ? 'holding' : ''} ${locked ? 'missed' : ''}`}
      onPointerDown={begin}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className="fill" style={{ transform: `scaleX(${progress})` }} />
      <span className="goal-title">{goal.title}</span>
      <span className="hold-hint">{locked ? '지나간 기록' : '길게 눌러 완료'}</span>
    </button>
  )
}
