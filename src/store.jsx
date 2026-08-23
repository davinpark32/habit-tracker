import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CATEGORY_BY_ID } from './goalCatalog'

const STORAGE_KEY = 'hopit.prototype.v2'

function pad(n) { return String(n).padStart(2, '0') }

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

export function todayKey() { return toDateKey(new Date()) }

export function shiftDays(key, days) {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

function makeGoal(title, date, category, completed = false) {
  return {
    id: crypto.randomUUID(), title, startDate: date, endDate: date, repeatDays: [], category,
    completions: completed ? { [date]: true } : {}, rewardedDates: completed ? { [date]: true } : {},
  }
}

function initialState() {
  const today = todayKey()
  return {
    goals: [
      makeGoal('헬스장 가기', today, 'exercise'), makeGoal('영어 공부하기', today, 'study'),
      makeGoal('책 읽기', today, 'study'), makeGoal('물 2L 마시기', today, 'life', true),
      makeGoal('산책하기', shiftDays(today, -1), 'exercise', true),
      makeGoal('친구에게 연락하기', shiftDays(today, -2), 'relationship', true),
      makeGoal('방 청소하기', shiftDays(today, 2), 'life'),
    ],
    candies: [],
    pet: { fedCount: 0, stats: { wisdom: 0, charm: 0, vitality: 0, warmth: 0, will: 0, diligence: 0 } },
    dayClearSeen: {},
  }
}

function emptyState() {
  return {
    goals: [], candies: [],
    pet: { fedCount: 0, stats: { wisdom: 0, charm: 0, vitality: 0, warmth: 0, will: 0, diligence: 0 } },
    dayClearSeen: {},
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : initialState()
  } catch { return initialState() }
}

function occursOn(goal, date) {
  if (date < goal.startDate || date > goal.endDate) return false
  if (!goal.repeatDays?.length) return true
  return goal.repeatDays.includes(parseDateKey(date).getDay())
}

function statusOf(instances) {
  if (instances.length === 0) return 'empty'
  const count = instances.filter((item) => item.completed).length
  if (count === instances.length) return 'done'
  if (count > 0) return 'partial'
  return 'planned'
}

function computeStreak(goals, today) {
  const get = (date) => goals.filter((goal) => occursOn(goal, date)).map((goal) => ({ completed: Boolean(goal.completions?.[date]) }))
  let cursor = today
  if (statusOf(get(cursor)) !== 'done') cursor = shiftDays(cursor, -1)
  let streak = 0
  while (statusOf(get(cursor)) === 'done') { streak += 1; cursor = shiftDays(cursor, -1) }
  return streak
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const today = todayKey()
  const [state, setState] = useState(loadState)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }, [state])

  const goalsOn = useCallback((date) => state.goals
    .filter((goal) => occursOn(goal, date))
    .map((goal) => ({ ...goal, date, completed: Boolean(goal.completions?.[date]), rewardClaimed: Boolean(goal.rewardedDates?.[date]) }))
    .sort((a, b) => Number(a.completed) - Number(b.completed)), [state.goals])

  const addGoal = useCallback((input) => {
    setState((prev) => ({ ...prev, goals: [...prev.goals, {
      id: crypto.randomUUID(), title: input.title.trim(), startDate: input.startDate,
      endDate: input.endDate || input.startDate, repeatDays: input.repeatDays || [], category: input.category,
      completions: {}, rewardedDates: {},
    }] }))
  }, [])

  const updateGoal = useCallback((id, input) => {
    setState((prev) => ({ ...prev, goals: prev.goals.map((goal) => goal.id === id ? {
      ...goal, title: input.title.trim(), startDate: input.startDate,
      endDate: input.endDate || input.startDate, repeatDays: input.repeatDays || [], category: input.category,
    } : goal) }))
  }, [])

  const completeGoal = useCallback((id, date) => {
    setState((prev) => {
      const goal = prev.goals.find((item) => item.id === id)
      if (!goal || goal.completions?.[date]) return prev
      const alreadyRewarded = Boolean(goal.rewardedDates?.[date])
      const category = CATEGORY_BY_ID[goal.category] ?? CATEGORY_BY_ID.life
      const candy = alreadyRewarded ? null : {
        id: crypto.randomUUID(), category: category.id, stat: category.stat, label: category.candy,
        icon: category.icon, color: category.color, earnedAt: Date.now(),
      }
      return {
        ...prev,
        goals: prev.goals.map((item) => item.id === id ? {
          ...item, completions: { ...item.completions, [date]: true }, rewardedDates: { ...item.rewardedDates, [date]: true },
        } : item),
        candies: candy ? [...prev.candies, candy] : prev.candies,
      }
    })
  }, [])

  const undoGoal = useCallback((id, date) => {
    setState((prev) => ({ ...prev, goals: prev.goals.map((goal) => {
      if (goal.id !== id) return goal
      const completions = { ...goal.completions }
      delete completions[date]
      return { ...goal, completions }
    }) }))
  }, [])

  const feedCandy = useCallback((id) => {
    setState((prev) => {
      const candy = prev.candies.find((item) => item.id === id)
      if (!candy) return prev
      return {
        ...prev, candies: prev.candies.filter((item) => item.id !== id),
        pet: { fedCount: prev.pet.fedCount + 1, stats: { ...prev.pet.stats, [candy.stat]: prev.pet.stats[candy.stat] + 1 } },
      }
    })
  }, [])

  const markDayClearSeen = useCallback((date) => {
    setState((prev) => ({ ...prev, dayClearSeen: { ...prev.dayClearSeen, [date]: true } }))
  }, [])

  const resetAll = useCallback(() => { localStorage.removeItem(STORAGE_KEY); setState(emptyState()) }, [])

  function monthMarks(year, month) {
    const marks = {}
    for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day += 1) {
      const date = toDateKey(new Date(year, month, day))
      const status = statusOf(goalsOn(date))
      if (status !== 'empty') marks[date] = status
    }
    return marks
  }

  const streak = useMemo(() => computeStreak(state.goals, today), [state.goals, today])
  const growthStage = Math.min(5, Math.floor(state.pet.fedCount / 5))
  const value = {
    today, goals: state.goals, candies: state.candies, pet: state.pet, growthStage, streak,
    goalsOn, addGoal, updateGoal, completeGoal, undoGoal, feedCandy, monthMarks,
    dayClearSeen: state.dayClearSeen, markDayClearSeen, resetAll,
    isPast: (date) => date < today,
    isDayComplete: (date) => statusOf(goalsOn(date)) === 'done',
    willCompleteDay: (id, date) => {
      const instances = goalsOn(date)
      return instances.length > 0 && instances.every((item) => item.id === id || item.completed)
    },
  }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('Store missing')
  return value
}
