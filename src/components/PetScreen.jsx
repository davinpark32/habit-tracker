import Pet from './Pet'
import { useStore } from '../store'

export default function PetScreen() {
  const { xpInLevel, xpMax, xp, streak, level } = useStore()
  return (
    <section className="screen pet-screen">
      <header className="topbar">
        <h1>나의 펫</h1>
      </header>
      <div className="hero tall">
        <Pet size={220} grown={Math.min(level - 1, 6)} />
        <h2 className="level">성장 Lv. {level}</h2>
        <p className="xp-label">
          XP {xpInLevel} / {xpMax}
        </p>
        <div className="gauge wide">
          <div className="gauge-fill" style={{ width: `${(xpInLevel / xpMax) * 100}%` }} />
        </div>
        <p className="muted">누적 XP {xp}</p>
        <p className="streak">연속 달성 {streak}일</p>
      </div>
    </section>
  )
}
