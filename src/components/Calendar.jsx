import { useMemo, useRef, useState } from 'react'
import { parseDateKey, toDateKey, useStore } from '../store'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function monthMatrix(year, month) {
  const first = new Date(year, month, 1)
  const start = first.getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < start; i += 1) cells.push(null)
  for (let day = 1; day <= days; day += 1) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function Calendar({ onSelectDate, onAdd }) {
  const { today, monthMarks } = useStore()
  const now = parseDateKey(today)
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [pressed, setPressed] = useState(null)
  const swipe = useRef(null)

  const cells = useMemo(
    () => monthMatrix(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  )
  const marks = monthMarks(cursor.year, cursor.month)

  function shift(delta) {
    setCursor((prev) => {
      const date = new Date(prev.year, prev.month + delta, 1)
      return { year: date.getFullYear(), month: date.getMonth() }
    })
  }

  function onTouchStart(event) {
    swipe.current = event.changedTouches[0].clientX
  }

  function onTouchEnd(event) {
    if (swipe.current == null) return
    const dx = event.changedTouches[0].clientX - swipe.current
    swipe.current = null
    if (dx > 50) shift(-1)
    if (dx < -50) shift(1)
  }

  return (
    <section className="screen" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header className="topbar calendar-head">
        <button className="icon-btn round" onClick={() => shift(-1)} aria-label="이전 달">‹</button>
        <h1>{cursor.year}년 {cursor.month + 1}월</h1>
        <button className="icon-btn round" onClick={() => shift(1)} aria-label="다음 달">›</button>
      </header>
      <div className="calendar">
        <div className="weekdays">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="grid">
          {cells.map((day, index) => {
            if (!day) return <div key={index} className="cell empty" />
            const key = toDateKey(new Date(cursor.year, cursor.month, day))
            const mark = marks[key]
            const isToday = key === today
            return (
              <button
                key={key}
                className={`cell ${isToday ? 'today' : ''} ${mark ?? ''} ${pressed === key ? 'pressed' : ''}`}
                onPointerDown={() => setPressed(key)}
                onPointerUp={() => setPressed(null)}
                onPointerCancel={() => setPressed(null)}
                onPointerLeave={() => setPressed(null)}
                onClick={() => onSelectDate(key)}
              >
                <span>{day}</span>
              </button>
            )
          })}
        </div>
      </div>
      <p className="hint">날짜를 누르면 그날의 목표가 열려요</p>
      <p className="hint quiet">초록은 그날 목표를 모두 끝낸 날이에요</p>
      <button className="fab" onClick={onAdd} aria-label="목표 추가">+</button>
    </section>
  )
}
