import { useEffect, useRef, useState } from 'react'
import { CATEGORY_BY_ID } from '../goalCatalog'

const HOLD_MS = 1440
const REWIND_MS = 280

function easeIn(t) {
  return t * t
}

export default function GoalCard({ goal, locked = false, onComplete, onUndo, onEdit }) {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const [armed, setArmed] = useState(false)
  const frame = useRef(0)
  const start = useRef(0)
  const progressRef = useRef(0)
  const mode = useRef('idle')
  const holdingRef = useRef(false)
  const doneRef = useRef(false)
  const category = CATEGORY_BY_ID[goal.category] ?? CATEGORY_BY_ID.life

  useEffect(() => () => {
    cancelAnimationFrame(frame.current)
  }, [])

  function setBar(value) {
    progressRef.current = value
    setProgress(value)
  }

  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    cancelAnimationFrame(frame.current)
    holdingRef.current = false
    mode.current = 'idle'
    setHolding(false)
    onComplete()
  }

  function rewind() {
    cancelAnimationFrame(frame.current)
    holdingRef.current = false
    setHolding(false)
    setArmed(false)
    mode.current = 'rewind'
    const from = progressRef.current
    const origin = performance.now()
    function step(now) {
      if (mode.current !== 'rewind') return
      const t = Math.min(1, (now - origin) / REWIND_MS)
      setBar(from * (1 - t) * (1 - t))
      if (t < 1) frame.current = requestAnimationFrame(step)
      else {
        setBar(0)
        mode.current = 'idle'
      }
    }
    frame.current = requestAnimationFrame(step)
  }

  function arm() {
    cancelAnimationFrame(frame.current)
    mode.current = 'armed'
    setBar(1)
    setArmed(true)
  }

  function tick(now) {
    const raw = Math.min(1, (now - start.current) / HOLD_MS)
    setBar(easeIn(raw))
    if (raw >= 1) {
      arm()
      return
    }
    frame.current = requestAnimationFrame(tick)
  }

  function begin(event) {
    if (locked || goal.completed) return
    event.preventDefault()
    cancelAnimationFrame(frame.current)
    doneRef.current = false
    mode.current = 'hold'
    holdingRef.current = true
    setArmed(false)
    setHolding(true)
    start.current = performance.now()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    frame.current = requestAnimationFrame(tick)
  }

  function onUp() {
    if (mode.current === 'armed') finish()
    else if (holdingRef.current && mode.current === 'hold') rewind()
  }

  function onLeave() {
    if (holdingRef.current && mode.current === 'hold') rewind()
  }

  function onClick(event) {
    if (mode.current === 'armed' || armed) {
      event.preventDefault()
      finish()
    }
  }

  if (goal.completed) return (
    <button className="goal-card completed" onClick={onUndo}>
      <span className="category-icon">{category.icon}</span>
      <span className="goal-copy"><span className="goal-title">{goal.title}</span><span className="hold-hint">✓ 완료 · 탭하여 완료 취소</span></span>
    </button>
  )

  const busy = holding || armed || progress > 0.02

  return (
    <div className={`goal-card-shell ${locked ? 'missed' : ''}`}>
      <button
        className={`goal-card ${holding ? 'holding' : ''} ${armed ? 'committed' : ''} ${busy ? 'busy' : ''}`}
        onPointerDown={begin}
        onPointerUp={onUp}
        onPointerLeave={onLeave}
        onPointerCancel={onUp}
        onClick={onClick}
        onContextMenu={(event) => event.preventDefault()}
      >
        <span className="fill" style={{ transform: `scaleX(${progress})` }} />
        <span className="category-icon">{category.icon}</span>
        <span className="goal-copy">
          <span className="goal-title">{goal.title}</span>
          <span className="hold-hint">{locked ? '지나간 기록' : '길게 눌러 완료'}</span>
        </span>
      </button>
      {onEdit && <button className="edit-goal" onClick={onEdit} aria-label={`${goal.title} 편집`}>✎</button>}
    </div>
  )
}
