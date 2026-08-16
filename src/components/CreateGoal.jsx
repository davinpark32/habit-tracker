import { useState } from 'react'
import { todayKey, useStore } from '../store'

export default function CreateGoal({ onBack, onSaved }) {
  const { addGoal } = useStore()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayKey())

  function save(event) {
    event.preventDefault()
    if (!title.trim()) return
    addGoal(title, date)
    onSaved(date)
  }

  return (
    <section className="screen">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="뒤로">
          ←
        </button>
        <h1>목표 추가</h1>
        <span className="spacer" />
      </header>
      <form className="form" onSubmit={save}>
        <label>
          목표 이름
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="헬스장에서 운동하기"
          />
        </label>
        <label>
          날짜
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <button className="save" type="submit" disabled={!title.trim()}>
          저장
        </button>
      </form>
    </section>
  )
}
