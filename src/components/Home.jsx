import Pet from './Pet'
import { useStore } from '../store'

export default function Home({ onOpenToday }) {
  const { today, goalsOn, xpInLevel, xpMax, streak, level } = useStore()
  const goals = goalsOn(today)
  const open = goals.filter((g) => !g.completed)
  const done = goals.filter((g) => g.completed)

  return (
    <section className="screen">
      <header className="topbar">
        <h1>오늘</h1>
      </header>
      <div className="hero">
        <Pet size={168} grown={Math.min(level - 1, 6)} />
        <p className="xp-label">
          XP {xpInLevel} / {xpMax}
        </p>
        <div className="gauge">
          <div className="gauge-fill" style={{ width: `${(xpInLevel / xpMax) * 100}%` }} />
        </div>
        <p className="streak">🔥 연속 달성 {streak}일</p>
      </div>
      <button className="today-card" onClick={onOpenToday}>
        <div className="section-head">
          <h2>오늘의 목표</h2>
          <span>{done.length}/{goals.length}</span>
        </div>
        <ul className="preview-list">
          {open.map((goal) => (
            <li key={goal.id}>
              <span>{goal.title}</span>
              <i className="box" />
            </li>
          ))}
          {done.map((goal) => (
            <li key={goal.id} className="done">
              <span>{goal.title}</span>
              <i className="box checked">✓</i>
            </li>
          ))}
        </ul>
      </button>
    </section>
  )
}
