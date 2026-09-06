import { useEffect, useRef, useState } from 'react'
import { CATEGORY_BY_ID } from '../goalCatalog'
import { useStore } from '../store'

const CHECK_MS = 700

export default function CompleteOverlay({ completion, onDone }) {
  const { completeGoal, markDayClearSeen } = useStore()
  const { goal, date, dayClear } = completion
  const category = CATEGORY_BY_ID[goal.category] ?? CATEGORY_BY_ID.life
  const earnedCandy = !goal.rewardClaimed
  const [phase, setPhase] = useState('check')
  const [waiting, setWaiting] = useState(false)
  const applied = useRef(false)
  const finishedCheck = useRef(false)

  function nextAfterCheck() {
    if (finishedCheck.current) return
    finishedCheck.current = true
    if (earnedCandy) setPhase('candy')
    else if (dayClear) setPhase('day')
    setWaiting(true)
  }

  useEffect(() => {
    if (!applied.current) {
      applied.current = true
      completeGoal(goal.id, date)
      if (dayClear) markDayClearSeen(date)
    }

    const checkTimer = setTimeout(nextAfterCheck, CHECK_MS)
    return () => clearTimeout(checkTimer)
  }, [completeGoal, date, dayClear, earnedCandy, goal.id, markDayClearSeen])

  function advance() {
    if (!waiting) return
    if (phase === 'candy' && dayClear) {
      setPhase('day')
      return
    }
    onDone()
  }

  return (
    <button type="button" className="overlay" onClick={advance}>
      <div className={`burst ${phase}`} key={phase}>
        {phase === 'check' && (
          <>
            <div className="check">✓</div>
            <p className="done-word">완료!</p>
          </>
        )}
        {phase === 'candy' && (
          <div className="earned-candy">
            <span style={{ background: category.color }}>{category.icon}</span>
            <p>{category.candy}를 얻었어요!</p>
            <small>펫 화면에서 직접 먹여보세요</small>
          </div>
        )}
        {phase === 'day' && (
          <div className="day-clear">
            <div className="check">✓</div>
            <p className="done-word">오늘의 목표 클리어!</p>
            <small>수고했어요!</small>
          </div>
        )}
        {waiting && <p className="continue-hint">탭해서 계속</p>}
      </div>
    </button>
  )
}
