import { useRef, useState } from 'react'
import { CATEGORY_BY_ID } from '../goalCatalog'

const HOLD_MS = 900

export default function GoalCard({ goal, locked = false, onComplete, onUndo, onEdit }) {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const frame = useRef(0)
  const start = useRef(0)
  const category = CATEGORY_BY_ID[goal.category] ?? CATEGORY_BY_ID.life

  function stop(success) {
    cancelAnimationFrame(frame.current); setHolding(false)
    if (success) { setProgress(1); onComplete() } else setProgress(0)
  }
  function tick(now) {
    const ratio = Math.min(1, (now - start.current) / HOLD_MS); setProgress(ratio)
    if (ratio >= 1) { stop(true); return }
    frame.current = requestAnimationFrame(tick)
  }
  function begin(event) {
    if (locked || goal.completed) return
    event.preventDefault(); setHolding(true); start.current = performance.now(); frame.current = requestAnimationFrame(tick)
  }
  function cancel() { if (holding) stop(false) }

  if (goal.completed) return (
    <button className="goal-card completed" onClick={onUndo}>
      <span className="category-icon">{category.icon}</span>
      <span className="goal-copy"><span className="goal-title">{goal.title}</span><span className="hold-hint">✓ 완료 · 탭하여 완료 취소</span></span>
    </button>
  )

  return (
    <div className={`goal-card-shell ${locked ? 'missed' : ''}`}>
      <button className={`goal-card ${holding ? 'holding' : ''}`} onPointerDown={begin} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel} onContextMenu={(event) => event.preventDefault()}>
        <span className="fill" style={{ transform: `scaleX(${progress})` }} />
        <span className="category-icon">{category.icon}</span>
        <span className="goal-copy"><span className="goal-title">{goal.title}</span><span className="hold-hint">{locked ? '지나간 기록' : '길게 눌러 완료'}</span></span>
      </button>
      {onEdit && <button className="edit-goal" onClick={onEdit} aria-label={`${goal.title} 편집`}>✎</button>}
    </div>
  )
}
