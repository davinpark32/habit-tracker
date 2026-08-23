import { useMemo, useState } from 'react'
import { CATEGORY_CATALOG, suggestCategory } from '../goalCatalog'
import { todayKey, useStore } from '../store'

const DAYS = [{ id: 1, label: '월' }, { id: 2, label: '화' }, { id: 3, label: '수' }, { id: 4, label: '목' }, { id: 5, label: '금' }, { id: 6, label: '토' }, { id: 0, label: '일' }]

export default function CreateGoal({ editingGoal, initialDate, onBack, onSaved }) {
  const { addGoal, updateGoal } = useStore()
  const [title, setTitle] = useState(editingGoal?.title ?? '')
  const [startDate, setStartDate] = useState(editingGoal?.startDate ?? initialDate ?? todayKey())
  const [hasPeriod, setHasPeriod] = useState(Boolean(editingGoal && editingGoal.endDate !== editingGoal.startDate))
  const [endDate, setEndDate] = useState(editingGoal?.endDate ?? initialDate ?? todayKey())
  const [repeatDays, setRepeatDays] = useState(editingGoal?.repeatDays ?? [])
  const suggestion = useMemo(() => suggestCategory(title), [title])
  const [selectedCategory, setSelectedCategory] = useState(editingGoal?.category ?? '')
  const category = selectedCategory || suggestion?.category || ''
  const selectedCatalog = CATEGORY_CATALOG.find((item) => item.id === category)

  function toggleDay(id) { setRepeatDays((prev) => prev.includes(id) ? prev.filter((day) => day !== id) : [...prev, id]) }
  function chooseSample(item, categoryId) { setTitle(item.title); setSelectedCategory(categoryId) }
  function save(event) {
    event.preventDefault()
    if (!title.trim() || !category) return
    const input = { title, startDate, endDate: hasPeriod ? endDate : startDate, repeatDays: hasPeriod ? repeatDays : [], category }
    if (editingGoal) updateGoal(editingGoal.id, input); else addGoal(input)
    onSaved(startDate)
  }

  return (
    <section className="screen create-screen">
      <header className="topbar"><button className="icon-btn" onClick={onBack} aria-label="뒤로">←</button><h1>{editingGoal ? '목표 편집' : '목표 추가'}</h1><span className="spacer" /></header>
      <form className="form" onSubmit={save}>
        <label>목표 이름<input autoFocus value={title} onChange={(event) => { setTitle(event.target.value); setSelectedCategory('') }} placeholder="무엇을 해볼까요?" /></label>
        <div className="sample-block">
          <span className="field-label">샘플에서 고르기</span>
          <div className="category-tabs">{CATEGORY_CATALOG.map((item) => <button type="button" key={item.id} className={category === item.id ? 'category-chip active' : 'category-chip'} onClick={() => setSelectedCategory(item.id)}>{item.icon} {item.label}</button>)}</div>
          {selectedCatalog && <div className="sample-grid">{selectedCatalog.samples.map((item) => <button type="button" key={item.title} onClick={() => chooseSample(item, selectedCatalog.id)}>{item.icon} {item.title}</button>)}</div>}
        </div>
        <label>활동 타입<select value={category} onChange={(event) => setSelectedCategory(event.target.value)}><option value="">직접 선택해 주세요</option>{CATEGORY_CATALOG.map((item) => <option key={item.id} value={item.id}>{item.icon} {item.label}</option>)}</select></label>
        {suggestion && !selectedCategory && <p className="suggestion">입력한 내용으로 “{CATEGORY_CATALOG.find((item) => item.id === suggestion.category)?.label}”을 추천했어요.</p>}
        <label>시작일<input type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); if (!hasPeriod) setEndDate(event.target.value) }} /></label>
        <label className="toggle-row"><input type="checkbox" checked={hasPeriod} onChange={(event) => setHasPeriod(event.target.checked)} /> 기간 설정</label>
        {hasPeriod && <><label>종료일<input type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label><fieldset className="repeat"><legend>매주 반복할 요일</legend><div className="weekday-picks">{DAYS.map((day) => <button type="button" key={day.id} className={repeatDays.includes(day.id) ? 'active' : ''} onClick={() => toggleDay(day.id)}>{day.label}</button>)}</div><p>요일을 고르지 않으면 설정한 기간 동안 매일 표시돼요.</p></fieldset></>}
        <button className="save" type="submit" disabled={!title.trim() || !category || (hasPeriod && endDate < startDate)}>{editingGoal ? '전체 일정 저장' : '목표 만들기'}</button>
      </form>
    </section>
  )
}
