import { useState } from 'react'
import Pet from './Pet'
import { useStore } from '../store'
import { STAT_META, levelCopy, levelForXp, recentGrowthText } from '../growthData'

export default function PetScreen() {
  const { candies, pet, growthStage, feedCandy, restoreSamples } = useStore()
  const [happy, setHappy] = useState(false)
  const [dragging, setDragging] = useState(null)
  const [dragPoint, setDragPoint] = useState(null)
  const [view, setView] = useState('pet')
  const [selectedStat, setSelectedStat] = useState(null)
  const [asleep, setAsleep] = useState(true)

  function feed(id) {
    if (!id) return
    feedCandy(id); setDragging(null); setHappy(true); setAsleep(false); setTimeout(() => setHappy(false), 900)
  }
  function restore() {
    if (window.confirm('목표, 완료 기록, 사탕과 펫 성장을 지우고 샘플 목표로 다시 시작할까요? 이 작업은 되돌릴 수 없어요.')) restoreSamples()
  }
  function pointerStart(event, candy) {
    setDragging(candy.id)
    setDragPoint({ id: candy.id, x: event.clientX, y: event.clientY, icon: candy.icon, color: candy.color })
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  function pointerMove(event, candy) {
    if (dragging === candy.id) {
      event.preventDefault()
      setDragPoint({ id: candy.id, x: event.clientX, y: event.clientY, icon: candy.icon, color: candy.color })
    }
  }
  function pointerEnd(event, candy) {
    const target = document.elementFromPoint(event.clientX, event.clientY)
    setDragPoint(null)
    if (target?.closest('.pet-drop')) feed(candy.id)
    else setDragging(null)
  }

  if (view === 'stats') {
    return (
      <GrowthScreen
        pet={pet}
        growthStage={growthStage}
        selectedStat={selectedStat}
        onSelect={setSelectedStat}
        onBack={() => selectedStat ? setSelectedStat(null) : setView('pet')}
      />
    )
  }

  return (
    <section className="screen pet-screen pet-room">
      <div className="pet-scene" aria-hidden="true">
        <svg className="pet-filters" aria-hidden="true">
          <defs>
            <filter id="hopit-crayon" x="-18%" y="-28%" width="136%" height="156%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="6" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" xChannelSelector="R" yChannelSelector="G" result="rough" />
              <feTurbulence type="fractalNoise" baseFrequency="1.55" numOctaves="3" seed="8" result="paper" />
              <feColorMatrix in="paper" type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.11  0 0 0 0.3 0" result="grain" />
              <feComposite in="grain" in2="rough" operator="in" result="clippedGrain" />
              <feBlend in="rough" in2="clippedGrain" mode="multiply" result="blended" />
              <feComposite in="blended" in2="rough" operator="in" />
            </filter>
          </defs>
        </svg>
        <div className="pet-wall" />
        <div className="pet-desk">
          <svg className="pet-desk-edge" viewBox="0 0 400 18" preserveAspectRatio="none">
            <path
              filter="url(#hopit-crayon)"
              fill="#e4d6c4"
              d="M-6 5 C 22 1 44 8 68 4 S 116 9 140 5 S 188 1 212 6 S 260 11 284 4 S 332 0 356 6 S 392 10 406 3 V 16 H -6 Z"
            />
          </svg>
        </div>
      </div>
      <header className="topbar">
        <span className="spacer" />
        <div className="top-actions">
          <button className="pet-stat-btn" onClick={() => setView('stats')} aria-label="성장의 흔적">✦</button>
          <button className="text-btn danger" onClick={restore}>샘플 복원</button>
        </div>
      </header>
      <div className={`pet-drop ${dragging ? 'ready' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); feed(event.dataTransfer.getData('text/plain') || dragging) }}>
        <Pet size={210} grown={growthStage} mood={happy ? 'happy' : 'idle'} stroke="full" asleep={asleep} onWake={() => setAsleep(false)} />
        {happy && <div className="speech">맛있어! ✦</div>}
        <p className="pet-line">{recentGrowthText(pet.feedHistory)}</p>
      </div>
      <section className={`candy-shelf ${candies.length ? 'open' : 'empty'}`} aria-label="사탕">
        {candies.length === 0 ? (
          <p className="shelf-empty">목표를 끝내면 사탕이 생겨요.</p>
        ) : (
          <div className="candy-tray">
            {candies.map((candy) => (
              <button
                key={candy.id}
                draggable
                onDragStart={(event) => { setDragging(candy.id); event.dataTransfer.setData('text/plain', candy.id) }}
                onDragEnd={() => setDragging(null)}
                onPointerDown={(event) => pointerStart(event, candy)}
                onPointerMove={(event) => pointerMove(event, candy)}
                onPointerUp={(event) => pointerEnd(event, candy)}
                onPointerCancel={() => { setDragging(null); setDragPoint(null) }}
                style={{ '--candy': candy.color }}
              >
                <span>{candy.icon}</span>
                <small>{candy.label}</small>
              </button>
            ))}
          </div>
        )}
        {dragPoint && <div className="drag-candy-ghost" style={{ left: dragPoint.x, top: dragPoint.y, background: dragPoint.color }}>{dragPoint.icon}</div>}
      </section>
      <div className="tab-clear" aria-hidden="true" />
    </section>
  )
}

function GrowthScreen({ pet, growthStage, selectedStat, onSelect, onBack }) {
  const history = pet.feedHistory ?? []
  if (selectedStat) {
    const meta = STAT_META[selectedStat]
    const xp = pet.stats[selectedStat] ?? 0
    const level = levelForXp(xp)
    const copy = levelCopy(selectedStat, xp)
    return (
      <section className="screen">
        <header className="topbar"><button className="icon-btn" onClick={onBack}>←</button><h1>{meta.icon} {meta.label}</h1><span className="spacer" /></header>
        {level === 0 ? (
          <div className="stat-detail undiscovered-detail">
            <h2>아직 발견하지 못한 모습</h2>
            <p>함께 시간을 보내다 보면 언젠가 새로운 모습을 발견하게 될지도 몰라요.</p>
          </div>
        ) : (
          <div className="stat-detail">
            <h2>Lv.{level}</h2>
            <div className="state-name">{copy[0]}</div>
            <p>{copy[1]}</p>
            <div className="stat-progress"><i style={{ width: `${level === 10 ? 100 : (xp % 10) * 10}%` }} /></div>
            <div className="xp-note">{level === 10 ? '이 모습이 아주 뚜렷하게 자랐어요.' : `다음 레벨까지 ${10 - (xp % 10)} XP`}</div>
          </div>
        )}
      </section>
    )
  }

  const stats = Object.entries(STAT_META).map(([id, meta]) => {
    const xp = pet.stats[id] ?? 0
    return { id, meta, xp, level: levelForXp(xp), copy: levelCopy(id, xp) }
  })
  const byKoreanName = (a, b) => a.meta.label.localeCompare(b.meta.label, 'ko-KR')
  const unlocked = stats.filter((stat) => stat.level > 0).sort(byKoreanName)
  const undiscovered = stats.filter((stat) => stat.level === 0).sort(byKoreanName)

  return (
    <section className="screen growth-screen">
      <header className="topbar"><button className="icon-btn" onClick={onBack}>←</button><h1>성장의 흔적</h1><span className="spacer" /></header>
      <div className="growth-hero">
        <div className="growth-pet"><Pet size={176} grown={growthStage} mood="idle" /></div>
        <p>{recentGrowthText(history)}</p>
        <span className="growth-scroll-hint">아래로 내려 성장의 흔적을 확인해 보세요</span>
      </div>
      <div className="growth-list">
        {unlocked.map(({ id, meta, xp, level, copy }) => (
          <button className="growth-row active" key={id} onClick={() => onSelect(id)}>
            <strong>{meta.icon} {meta.label} · Lv.{level}</strong>
            <small>{copy[0]}</small>
            <div className="stat-progress"><i style={{ width: `${level === 10 ? 100 : (xp % 10) * 10}%` }} /></div>
          </button>
        ))}
        {undiscovered.length > 0 && unlocked.length > 0 && <div className="growth-divider" aria-hidden="true" />}
        {undiscovered.map(({ id, meta }) => (
          <button className="growth-row undiscovered" key={id} onClick={() => onSelect(id)}>{meta.label} · 아직 발견하지 못한 모습</button>
        ))}
      </div>
    </section>
  )
}
