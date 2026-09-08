import { useStore } from '../store'

const TABS = [
  { id: 'today', label: '오늘' },
  { id: 'calendar', label: '캘린더' },
  { id: 'pet', label: '펫' },
]

export default function TabBar({ tab, onChange }) {
  const { candies } = useStore()
  const candyCount = candies.length

  return (
    <nav className="tabbar">
      {TABS.map((item) => (
        <button
          key={item.id}
          className={tab === item.id ? 'tab active' : 'tab'}
          onClick={() => onChange(item.id)}
          aria-label={item.id === 'pet' && candyCount > 0 ? `${item.label}, 사탕 ${candyCount}개` : item.label}
        >
          {item.label}
          {item.id === 'pet' && candyCount > 0 && (
            <span className="tab-badge" aria-hidden="true"><span>{candyCount > 9 ? '9+' : candyCount}</span></span>
          )}
        </button>
      ))}
    </nav>
  )
}
