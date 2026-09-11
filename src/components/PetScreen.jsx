import { useEffect, useState } from 'react'
import Pet from './Pet'
import { useStore } from '../store'
import { STAT_META, levelCopy, levelForXp, recentGrowthText } from '../growthData'

const AMBIENT_MOODS = ['idle', 'asleep', 'lounging']
function pickAmbientMood() {
  return AMBIENT_MOODS[Math.floor(Math.random() * AMBIENT_MOODS.length)]
}

const DRIFT_PERIOD_MS = 5000
const PET_RANGE = 65
const BROOM_SIDE_OFFSET = 55
const READ_PERIOD_MS = 3600
const READ_SWEEP_FRACTION = 0.85
const READ_GAZE_Y = 0.6

export default function PetScreen() {
  const { candies, pet, growthStage, feedCandy, restoreSamples } = useStore()
  const [happy, setHappy] = useState(false)
  const [dragging, setDragging] = useState(null)
  const [dragPoint, setDragPoint] = useState(null)
  const [view, setView] = useState('pet')
  const [selectedStat, setSelectedStat] = useState(null)
  const [ambientMood, setAmbientMood] = useState(pickAmbientMood)
  const [cleaning, setCleaning] = useState(false)
  const [cleanTime, setCleanTime] = useState(0)
  const [singing, setSinging] = useState(false)
  const [exercising, setExercising] = useState(false)
  const [reading, setReading] = useState(false)
  const [readTime, setReadTime] = useState(0)
  const asleep = ambientMood === 'asleep'
  const lounging = ambientMood === 'lounging'

  function toggleTest(setter, others) {
    setter((v) => {
      const next = !v
      if (next) {
        others.forEach((setOther) => setOther(false))
        setAmbientMood('idle')
      }
      return next
    })
  }

  useEffect(() => {
    if (!cleaning) return
    let frame
    const start = performance.now()
    function loop(now) {
      setCleanTime(now - start)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [cleaning])

  useEffect(() => {
    if (!reading) return
    let frame
    const start = performance.now()
    function loop(now) {
      setReadTime(now - start)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [reading])

  const readPhase = (readTime % READ_PERIOD_MS) / READ_PERIOD_MS
  const readGazeX = readPhase < READ_SWEEP_FRACTION
    ? -1 + 2 * (readPhase / READ_SWEEP_FRACTION)
    : 1 - 2 * ((readPhase - READ_SWEEP_FRACTION) / (1 - READ_SWEEP_FRACTION))

  const driftAngle = (cleanTime / DRIFT_PERIOD_MS) * Math.PI * 2
  const petX = Math.sin(driftAngle) * PET_RANGE
  const side = Math.tanh(Math.cos(driftAngle) * 4)
  const broomX = petX + side * BROOM_SIDE_OFFSET

  function feed(id) {
    if (!id) return
    feedCandy(id); setDragging(null); setHappy(true); setAmbientMood('idle'); setTimeout(() => setHappy(false), 900)
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
        <div className="test-toggle-group">
          <button
            className="text-btn test-toggle"
            onClick={() => toggleTest(setCleaning, [setSinging, setExercising, setReading])}
            aria-label="테스트: 청소하기 애니메이션"
          >🧹 테스트</button>
          <button
            className="text-btn test-toggle"
            onClick={() => toggleTest(setSinging, [setCleaning, setExercising, setReading])}
            aria-label="테스트: 노래하기 애니메이션"
          >🎤 테스트</button>
          <button
            className="text-btn test-toggle"
            onClick={() => toggleTest(setExercising, [setCleaning, setSinging, setReading])}
            aria-label="테스트: 덤벨 운동 애니메이션"
          >🏋️ 테스트</button>
          <button
            className="text-btn test-toggle"
            onClick={() => toggleTest(setReading, [setCleaning, setSinging, setExercising])}
            aria-label="테스트: 책읽기 애니메이션"
          >📖 테스트</button>
        </div>
        <div className="top-actions">
          <button className="pet-stat-btn" onClick={() => setView('stats')} aria-label="성장의 흔적">✦</button>
          <button className="text-btn danger" onClick={restore}>샘플 복원</button>
        </div>
      </header>
      <div className={`pet-drop ${dragging ? 'ready' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); feed(event.dataTransfer.getData('text/plain') || dragging) }}>
        <div className="pet-stage">
          {cleaning && (
            <div className="pet-broom-drift" style={{ transform: `translateX(calc(-50% + ${broomX}px))` }}>
              <svg className="pet-broom" viewBox="0 0 60 80" aria-hidden="true">
                <line x1="30" y1="4" x2="30" y2="47" stroke="#8b5e34" strokeWidth="5" strokeLinecap="round" />
                <path
                  fill="#e0b24a"
                  filter="url(#hopit-crayon)"
                  d="M19 47 L41 47 L47 73 L13 73 Z"
                />
                <line x1="21" y1="49" x2="15" y2="72" stroke="#a9782c" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="25.5" y1="48" x2="22.5" y2="73" stroke="#a9782c" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="30" y1="48" x2="30" y2="73" stroke="#a9782c" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="34.5" y1="48" x2="37.5" y2="73" stroke="#a9782c" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="39" y1="49" x2="45" y2="72" stroke="#a9782c" strokeWidth="1.6" strokeLinecap="round" />
                <rect x="16" y="43" width="28" height="7" rx="2.5" fill="#5b4636" />
              </svg>
              <div className="pet-dust" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          {singing && (
            <div className="pet-mic-stand">
              <svg className="pet-mic" viewBox="0 0 50 90" aria-hidden="true">
                <ellipse cx="25" cy="86" rx="14" ry="4" fill="#4a4a4a" />
                <line x1="25" y1="84" x2="25" y2="34" stroke="#4a4a4a" strokeWidth="4" strokeLinecap="round" />
                <rect x="21" y="30" width="8" height="8" rx="2" fill="#6b6560" />
                <ellipse cx="25" cy="18" rx="12" ry="16" fill="#3f342c" filter="url(#hopit-crayon)" />
                <ellipse cx="21" cy="12" rx="3.5" ry="5" fill="rgba(255,255,255,0.18)" />
              </svg>
            </div>
          )}
          {exercising && (
            <div className="pet-dumbbell-stand">
              <svg className="pet-dumbbell" viewBox="0 0 70 40" aria-hidden="true">
                <rect x="20" y="17" width="30" height="6" rx="3" fill="#6b6560" />
                <circle cx="14" cy="20" r="13" fill="#3f342c" filter="url(#hopit-crayon)" />
                <circle cx="56" cy="20" r="13" fill="#3f342c" filter="url(#hopit-crayon)" />
                <ellipse cx="10" cy="15" rx="3" ry="4" fill="rgba(255,255,255,0.16)" />
                <ellipse cx="52" cy="15" rx="3" ry="4" fill="rgba(255,255,255,0.16)" />
              </svg>
            </div>
          )}
          {reading && (
            <div className="pet-book-stand">
              <svg className="pet-book" viewBox="0 0 90 60" aria-hidden="true">
                <rect x="5" y="6" width="36" height="52" rx="2" fill="#fdf6ec" />
                <g className="pet-book-page">
                  <rect x="49" y="6" width="36" height="52" rx="2" fill="#fdf6ec" />
                  <rect x="50" y="3" width="32" height="50" rx="3" fill="#2f6fb3" filter="url(#hopit-crayon)" />
                </g>
                <rect x="8" y="3" width="32" height="50" rx="3" fill="#2f6fb3" filter="url(#hopit-crayon)" />
                <rect x="39" y="2" width="12" height="52" rx="3" fill="#1f4d80" />
              </svg>
            </div>
          )}
          <div className={cleaning ? 'pet-chasing' : undefined} style={cleaning ? { transform: `translateX(${petX}px)` } : undefined}>
            <Pet size={210} grown={growthStage} mood={happy ? 'happy' : 'idle'} stroke="full" asleep={asleep} lounging={lounging} cleaning={cleaning} singing={singing} exercising={exercising} reading={reading} gazeX={reading ? readGazeX : null} gazeY={reading ? READ_GAZE_Y : null} onWake={() => setAmbientMood('idle')} />
          </div>
        </div>
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
