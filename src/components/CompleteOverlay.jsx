import { useEffect, useRef, useState } from 'react'
import Pet from './Pet'
import { useStore } from '../store'

export default function CompleteOverlay({ goal, onDone }) {
  const { completeGoal, xpInLevel, xpMax, level, reward } = useStore()
  const [phase, setPhase] = useState('check')
  const [xpShown, setXpShown] = useState(xpInLevel)
  const rewarded = useRef(false)

  useEffect(() => {
    if (!rewarded.current) {
      rewarded.current = true
      completeGoal(goal.id)
    }
    const timers = [
      setTimeout(() => setPhase('xp'), 450),
      setTimeout(() => {
        setPhase('pet')
        setXpShown((value) => Math.min(xpMax, value + reward))
      }, 950),
      setTimeout(onDone, 2100),
    ]
    return () => timers.forEach(clearTimeout)
  }, [completeGoal, goal.id, onDone, reward, xpMax])

  return (
    <div className="overlay">
      <div className={`burst ${phase}`}>
        {phase !== 'pet' && (
          <>
            <div className="check">✓</div>
            <p className="done-word">완료!</p>
            {phase === 'xp' && <p className="xp-pop">+{reward} XP</p>}
          </>
        )}
        {phase === 'pet' && (
          <div className="reward-pet">
            <Pet size={180} mood="happy" grown={Math.min(level - 1, 6)} />
            <div className="stars">✦ ✦ ✦</div>
            <p className="xp-label">
              XP {xpShown} / {xpMax}
            </p>
            <div className="gauge">
              <div className="gauge-fill" style={{ width: `${(xpShown / xpMax) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
