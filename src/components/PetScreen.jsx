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

  function feed(id) {
    if (!id) return
    feedCandy(id); setDragging(null); setHappy(true); setTimeout(() => setHappy(false), 900)
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
    <section className="screen pet-screen">
      <header className="topbar">
        <h1>포켓 파를레</h1>
        <div className="top-actions">
          <button className="pet-stat-btn" onClick={() => setView('stats')} aria-label="성장의 흔적">✦</button>
          <button className="text-btn danger" onClick={restore}>샘플 복원</button>
        </div>
      </header>
      <div className={`pet-drop ${dragging ? 'ready' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); feed(event.dataTransfer.getData('text/plain') || dragging) }}>
        <Pet size={190} grown={growthStage} mood={happy ? 'happy' : 'idle'} />
        {happy && <div className="speech">맛있어! ✦</div>}
        <p>성장 단계 {growthStage + 1} · 먹은 사탕 {pet.fedCount}개</p>
        <small>사탕을 파를레에게 드래그해 주세요</small>
      </div>
      <section className="inventory">
        <div className="section-head"><h2>사탕 보관함</h2><span>{candies.length}개</span></div>
        {candies.length === 0 ? <p className="empty">목표를 완료하면 활동에 맞는 사탕이 생겨요.</p> : (
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
        <p className="touch-note">사탕을 잡는 동안에는 화면 대신 사탕이 움직여요.</p>
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
