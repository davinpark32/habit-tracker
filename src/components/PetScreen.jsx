import { useState } from 'react'
import { STATS } from '../goalCatalog'
import Pet from './Pet'
import { useStore } from '../store'

export default function PetScreen() {
  const { candies, pet, growthStage, streak, feedCandy, restoreSamples } = useStore()
  const [happy, setHappy] = useState(false)
  const [dragging, setDragging] = useState(null)

  function feed(id) {
    if (!id) return
    feedCandy(id); setDragging(null); setHappy(true); setTimeout(() => setHappy(false), 900)
  }
  function restore() {
    if (window.confirm('목표, 완료 기록, 사탕과 펫 성장을 지우고 샘플 목표로 다시 시작할까요? 이 작업은 되돌릴 수 없어요.')) restoreSamples()
  }

  return (
    <section className="screen pet-screen">
      <header className="topbar"><h1>포켓 파를레</h1><button className="text-btn danger" onClick={restore}>샘플 복원</button></header>
      <div className={`pet-drop ${dragging ? 'ready' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); feed(event.dataTransfer.getData('text/plain') || dragging) }}>
        <Pet size={190} grown={growthStage} mood={happy ? 'happy' : 'idle'} />
        {happy && <div className="speech">맛있어! ✦</div>}
        <p>성장 단계 {growthStage + 1} · 먹은 사탕 {pet.fedCount}개</p><small>손가락을 움직이면 시선을 따라와요 · 사탕을 파를레에게 드래그해 주세요</small>
      </div>
      <section className="inventory"><div className="section-head"><h2>사탕 보관함</h2><span>{candies.length}개</span></div>{candies.length === 0 ? <p className="empty">목표를 완료하면 활동에 맞는 사탕이 생겨요.</p> : <div className="candy-tray">{candies.map((candy) => <button key={candy.id} draggable onDragStart={(event) => { setDragging(candy.id); event.dataTransfer.setData('text/plain', candy.id) }} onDragEnd={() => setDragging(null)} onClick={() => feed(candy.id)} style={{ '--candy': candy.color }}><span>{candy.icon}</span><small>{candy.label}</small></button>)}</div>}<p className="touch-note">모바일에서는 사탕을 탭해도 먹일 수 있어요.</p></section>
      <section className="stats-panel"><h2>파를레의 성장</h2><div className="stat-list">{STATS.map((stat) => <div key={stat.id}><span>{stat.label}</span><div><i style={{ width: `${Math.min(100, pet.stats[stat.id] * 10)}%` }} /></div><b>{pet.stats[stat.id]}</b></div>)}</div><p className="streak">연속 달성 {streak}일</p></section>
    </section>
  )
}
