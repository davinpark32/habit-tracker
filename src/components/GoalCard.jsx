import { useEffect, useRef, useState } from 'react'
import { CATEGORY_BY_ID } from '../goalCatalog'

const HOLD_MS = 1440
const REWIND_MS = 280
const ARM_MS = 160
const SLOP_PX = 12
const SWIPE_OPEN = 64
const SWIPE_MAX = 88

function easeIn(t) {
  return t * t
}

export default function GoalCard({ goal, locked = false, onComplete, onUndo, onEdit, onTap, onDelete }) {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const [armed, setArmed] = useState(false)
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [deleteMenu, setDeleteMenu] = useState(false)
  const frame = useRef(0)
  const start = useRef(0)
  const progressRef = useRef(0)
  const mode = useRef('idle')
  const holdingRef = useRef(false)
  const doneRef = useRef(false)
  const pendingTimer = useRef(0)
  const origin = useRef({ x: 0, y: 0 })
  const pointerId = useRef(null)
  const cardRef = useRef(null)
  const moved = useRef(false)
  const offsetRef = useRef(0)
  const category = CATEGORY_BY_ID[goal.category] ?? CATEGORY_BY_ID.life

  useEffect(() => () => {
    cancelAnimationFrame(frame.current)
    window.clearTimeout(pendingTimer.current)
  }, [])

  function setBar(value) {
    progressRef.current = value
    setProgress(value)
  }

  function clearPending() {
    window.clearTimeout(pendingTimer.current)
    pendingTimer.current = 0
  }

  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    cancelAnimationFrame(frame.current)
    clearPending()
    holdingRef.current = false
    mode.current = 'idle'
    setHolding(false)
    onComplete()
  }

  function rewind() {
    cancelAnimationFrame(frame.current)
    clearPending()
    holdingRef.current = false
    setHolding(false)
    setArmed(false)
    mode.current = 'rewind'
    const from = progressRef.current
    const originTime = performance.now()
    function step(now) {
      if (mode.current !== 'rewind') return
      const t = Math.min(1, (now - originTime) / REWIND_MS)
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

  function startHold() {
    if (mode.current !== 'pending') return
    mode.current = 'hold'
    holdingRef.current = true
    doneRef.current = false
    setArmed(false)
    setHolding(true)
    start.current = performance.now()
    if (pointerId.current != null) cardRef.current?.setPointerCapture?.(pointerId.current)
    frame.current = requestAnimationFrame(tick)
  }

  function begin(event) {
    if (locked) return
    if (event.button != null && event.button !== 0) return
    clearPending()
    cancelAnimationFrame(frame.current)
    doneRef.current = false
    moved.current = false
    pointerId.current = event.pointerId
    origin.current = { x: event.clientX, y: event.clientY }
    setArmed(false)
    if (goal.completed) {
      mode.current = 'idle'
      return
    }
    mode.current = 'pending'
    pendingTimer.current = window.setTimeout(startHold, ARM_MS)
  }

  function onMove(event) {
    const dx = event.clientX - origin.current.x
    const dy = event.clientY - origin.current.y
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved.current = true

    if (onDelete && !holdingRef.current && mode.current !== 'hold' && mode.current !== 'armed') {
      if (Math.abs(dx) > Math.abs(dy) && dx < 0 && (mode.current === 'pending' || mode.current === 'idle' || mode.current === 'swipe')) {
        clearPending()
        mode.current = 'swipe'
        setSwiping(true)
        const next = Math.max(-SWIPE_MAX, dx)
        offsetRef.current = next
        setOffset(next)
        event.preventDefault()
        return
      }
    }

    if (mode.current !== 'pending') return
    if (dx * dx + dy * dy > SLOP_PX * SLOP_PX) {
      clearPending()
      mode.current = 'scroll'
    }
  }

  function onUp() {
    clearPending()
    if (mode.current === 'swipe' || swiping) {
      const open = offsetRef.current <= -SWIPE_OPEN
      offsetRef.current = open ? -SWIPE_MAX : 0
      setOffset(offsetRef.current)
      setSwiping(false)
      mode.current = 'idle'
      return
    }
    if (mode.current === 'armed') finish()
    else if (holdingRef.current && mode.current === 'hold') rewind()
    else {
      mode.current = 'idle'
      if (!moved.current && !goal.completed) onTap?.()
    }
  }

  function onLeave() {
    if (mode.current === 'pending') {
      clearPending()
      mode.current = 'idle'
    } else if (holdingRef.current && mode.current === 'hold') rewind()
  }

  function onCancel() {
    clearPending()
    if (holdingRef.current && (mode.current === 'hold' || mode.current === 'armed')) rewind()
    else mode.current = 'idle'
  }

  function onClick(event) {
    if (mode.current === 'armed' || armed) {
      event.preventDefault()
      finish()
    }
  }

  function requestDelete() {
    if (goal.repeatDays?.length || goal.startDate !== goal.endDate) {
      setDeleteMenu(true)
      return
    }
    if (window.confirm('이 목표를 삭제할까요?')) onDelete?.('all')
    offsetRef.current = 0
    setOffset(0)
  }

  function confirmDelete(scope) {
    onDelete?.(scope)
    setDeleteMenu(false)
    offsetRef.current = 0
    setOffset(0)
  }

  const busy = holding || armed || progress > 0.02
  const card = goal.completed ? (
    <button className="goal-card completed" onClick={(event) => { if (moved.current || offsetRef.current < 0) { event.preventDefault(); return } onUndo() }} onPointerDown={begin} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel} onContextMenu={(event) => event.preventDefault()}>
      <span className="category-icon">{category.icon}</span>
      <span className="goal-copy"><span className="goal-title">{goal.title}</span><span className="hold-hint">✓ 완료 · 탭하여 완료 취소</span></span>
    </button>
  ) : (
    <button
      ref={cardRef}
      className={`goal-card ${holding ? 'holding' : ''} ${armed ? 'committed' : ''} ${busy ? 'busy' : ''}`}
      onPointerDown={begin}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onLeave}
      onPointerCancel={onCancel}
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
  )

  return (
    <>
      <div className={`swipe-shell goal-card-shell ${locked ? 'missed' : ''}`}>
        {onDelete && <button className="swipe-delete" onClick={requestDelete}>삭제</button>}
        <div className={`swipe-card ${swiping ? 'swiping' : ''}`} style={{ transform: `translateX(${offset}px)` }}>
          {card}
          {onEdit && <button className="edit-goal" onClick={onEdit} aria-label={`${goal.title} 편집`}>✎</button>}
        </div>
      </div>
      {deleteMenu && (
        <div className="delete-sheet-backdrop" onClick={() => setDeleteMenu(false)}>
          <div className="delete-sheet" onClick={(event) => event.stopPropagation()}>
            <p>반복 목표를 어떻게 삭제할까요?</p>
            <button onClick={() => confirmDelete('today')}>오늘만 삭제</button>
            <button className="danger" onClick={() => confirmDelete('all')}>전체 반복 목표 삭제</button>
            <button className="cancel" onClick={() => setDeleteMenu(false)}>취소</button>
          </div>
        </div>
      )}
    </>
  )
}
