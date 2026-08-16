import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const XP_PER_LEVEL = 200
const XP_REWARD = 10

function pad(n) {
  return String(n).padStart(2, '0')
}

export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatKoreanDate(key) {
  const date = parseDateKey(key)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

export function todayKey() {
  return toDateKey(new Date())
}

function shiftDays(key, days) {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

function seedGoals(today) {
  const t = (offset, title, completed) => ({
    id: crypto.randomUUID(),
    title,
    date: shiftDays(today, offset),
    completed,
  })

  return [
    t(0, '헬스장에서 운동하기', false),
    t(0, '영어 단어 20개 외우기', false),
    t(0, '독서 30분 하기', false),
    t(0, '물 2L 마시기', true),
    t(-1, '아침 산책 20분', true),
    t(-1, '비타민 챙겨 먹기', true),
    t(-2, '스트레칭 10분', true),
    t(-3, '물 2L 마시기', true),
    t(-4, '영어 단어 20개 외우기', true),
    t(-5, '독서 30분 하기', true),
    t(-6, '헬스장에서 운동하기', true),
    t(-7, '물 2L 마시기', false),
    t(-7, '명상 5분', true),
    t(-9, '친구에게 안부 메시지', true),
    t(2, '주말 러닝', false),
    t(4, '방 정리하기', false),
  ]
}

function dayStatus(goals) {
  if (goals.length === 0) return 'empty'
  const completed = goals.filter((g) => g.completed).length
  if (completed === goals.length) return 'done'
  if (completed > 0) return 'partial'
  return 'planned'
}

function isCompleteDay(dayGoals) {
  return dayGoals.length > 0 && dayGoals.every((g) => g.completed)
}

function computeStreak(goals, today) {
  const byDate = new Map()
  for (const goal of goals) {
    if (!byDate.has(goal.date)) byDate.set(goal.date, [])
    byDate.get(goal.date).push(goal)
  }

  let cursor = today
  if (!isCompleteDay(byDate.get(cursor) ?? [])) cursor = shiftDays(cursor, -1)

  let streak = 0
  while (isCompleteDay(byDate.get(cursor) ?? [])) {
    streak += 1
    cursor = shiftDays(cursor, -1)
  }
  return streak
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const today = todayKey()
  const [goals, setGoals] = useState(() => seedGoals(today))
  const [xp, setXp] = useState(920)

  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  const xpInLevel = xp % XP_PER_LEVEL
  const streak = useMemo(() => computeStreak(goals, today), [goals, today])

  function goalsOn(date) {
    return goals
      .filter((g) => g.date === date)
      .sort((a, b) => Number(a.completed) - Number(b.completed))
  }

  const addGoal = useCallback((title, date) => {
    setGoals((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: title.trim(), date, completed: false },
    ])
  }, [])

  const completeGoal = useCallback((id) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === id && !goal.completed ? { ...goal, completed: true } : goal)),
    )
    setXp((value) => value + XP_REWARD)
  }, [])

  function monthMarks(year, month) {
    const prefix = `${year}-${pad(month + 1)}-`
    const map = {}
    for (const goal of goals) {
      if (!goal.date.startsWith(prefix)) continue
      if (!map[goal.date]) map[goal.date] = []
      map[goal.date].push(goal)
    }
    const marks = {}
    for (const [date, dayGoals] of Object.entries(map)) {
      marks[date] = dayStatus(dayGoals)
    }
    return marks
  }

  const value = {
    today,
    goals,
    xp,
    xpInLevel,
    xpMax: XP_PER_LEVEL,
    level,
    streak,
    reward: XP_REWARD,
    goalsOn,
    addGoal,
    completeGoal,
    monthMarks,
    isPast: (date) => date < today,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('Store missing')
  return value
}
