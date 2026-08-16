export default function Pet({ size = 140, mood = 'idle', grown = 0 }) {
  const scale = 1 + grown * 0.08
  return (
    <div className={`pet pet-${mood}`} style={{ width: size, height: size * 1.08 }}>
      <svg viewBox="0 0 160 170" width="100%" height="100%" aria-hidden="true">
        <ellipse cx="80" cy="156" rx="42" ry="8" fill="rgba(232, 122, 74, 0.18)" />
        <g style={{ transform: `scale(${scale})`, transformOrigin: '80px 110px' }}>
          <ellipse cx="46" cy="58" rx="16" ry="22" fill="#F4B183" />
          <ellipse cx="114" cy="58" rx="16" ry="22" fill="#F4B183" />
          <ellipse cx="46" cy="58" rx="8" ry="12" fill="#F7D3B0" />
          <ellipse cx="114" cy="58" rx="8" ry="12" fill="#F7D3B0" />
          <ellipse cx="80" cy="96" rx="54" ry="48" fill="#F6C29A" />
          <ellipse cx="80" cy="108" rx="40" ry="32" fill="#FBE3C8" />
          <circle cx="80" cy="78" r="36" fill="#F6C29A" />
          <ellipse cx="62" cy="86" rx="10" ry="7" fill="#E88962" opacity="0.35" />
          <ellipse cx="98" cy="86" rx="10" ry="7" fill="#E88962" opacity="0.35" />
          {mood === 'happy' ? (
            <>
              <path d="M54 78 q8 10 16 0" fill="none" stroke="#3A2A22" strokeWidth="4" strokeLinecap="round" />
              <path d="M90 78 q8 10 16 0" fill="none" stroke="#3A2A22" strokeWidth="4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="62" cy="80" r="5.5" fill="#3A2A22" />
              <circle cx="98" cy="80" r="5.5" fill="#3A2A22" />
              <circle cx="64" cy="78" r="1.6" fill="#fff" />
              <circle cx="100" cy="78" r="1.6" fill="#fff" />
            </>
          )}
          <ellipse cx="80" cy="96" rx="8" ry="5.5" fill="#E88962" />
          <path d="M72 108 q8 8 16 0" fill="none" stroke="#D97850" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  )
}
