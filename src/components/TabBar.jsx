const TABS = [
  { id: 'today', label: '오늘' },
  { id: 'calendar', label: '캘린더' },
  { id: 'pet', label: '펫' },
]

export default function TabBar({ tab, onChange }) {
  return (
    <nav className="tabbar">
      {TABS.map((item) => (
        <button
          key={item.id}
          className={tab === item.id ? 'tab active' : 'tab'}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
