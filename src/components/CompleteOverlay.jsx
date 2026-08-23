import { useEffect, useRef, useState } from 'react'
import { CATEGORY_BY_ID } from '../goalCatalog'
import { useStore } from '../store'

export default function CompleteOverlay({ completion, onDone }) {
  const { completeGoal, markDayClearSeen } = useStore()
  const { goal, date, dayClear } = completion
  const category = CATEGORY_BY_ID[goal.category] ?? CATEGORY_BY_ID.life
  const earnedCandy = !goal.rewardClaimed
  const [phase, setPhase] = useState('check')
  const applied = useRef(false)

  useEffect(() => {
    if (!applied.current) {
      applied.current = true
      completeGoal(goal.id, date)
      if (dayClear) markDayClearSeen(date)
    }

    const timers = []
    if (earnedCandy) {
      timers.push(setTimeout(() => setPhase('candy'), 500))
      timers.push(setTimeout(() => (dayClear ? setPhase('day') : onDone()), 1350))
    } else {
      timers.push(setTimeout(() => (dayClear ? setPhase('day') : onDone()), 700))
    }
    if (dayClear) timers.push(setTimeout(onDone, earnedCandy ? 2600 : 2000))

    return () => timers.forEach(clearTimeout)
  }, [completeGoal, date, dayClear, earnedCandy, goal.id, markDayClearSeen, onDone])

  return (
    <div className="overlay">
      <div className={`burst ${phase}`}>
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
      </div>
    </div>
  )
}
