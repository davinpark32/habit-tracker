import { useEffect, useRef } from 'react'

export default function PetV1({ size = 140, mood = 'idle', grown = 0 }) {
  const wrapRef = useRef(null)
  const bodyLookRef = useRef(null)
  const faceRef = useRef(null)
  const look = useRef({ x: 0, y: 0 })
  const target = useRef({ x: 0, y: 0 })
  const lastPointer = useRef(0)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    let frame = 0
    let running = true

    function onPointerMove(event) {
      const rect = wrap.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      target.current.x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2))
      target.current.y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2))
      lastPointer.current = performance.now()
    }

    function tick(now) {
      if (!running) return
      const idle = now - lastPointer.current > 1600
      const aimX = idle ? Math.sin(now * 0.0011) * 0.22 : target.current.x
      const aimY = idle ? Math.cos(now * 0.0008) * 0.1 : target.current.y
      look.current.x += (aimX - look.current.x) * 0.12
      look.current.y += (aimY - look.current.y) * 0.12
      const { x, y } = look.current
      if (bodyLookRef.current) bodyLookRef.current.style.transform = `translate(${x * 3}px, ${y * 1.5}px)`
      if (faceRef.current) faceRef.current.style.transform = `translate(${x * 8}px, ${y * 5}px)`
      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    frame = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [])

  const scale = 1 + grown * 0.08

  return (
    <div
      ref={wrapRef}
      className={`pet pet-${mood}`}
      style={{ width: size, height: size * 1.12 }}
      aria-label="파를레"
    >
      <svg viewBox="0 0 240 210" width="100%" height="100%" aria-hidden="true">
        <ellipse cx="120" cy="198" rx="58" ry="7" fill="rgba(40, 30, 24, 0.12)" />
        <g style={{ transform: `scale(${scale})`, transformOrigin: '120px 188px' }}>
          <g ref={bodyLookRef} className="pet-body-look">
            <g className="pet-body">
              <path
                fill="#141414"
                stroke="#f6efe6"
                strokeWidth="4"
                strokeLinejoin="round"
                d="M58 119 C55 101 66 81 91 75 C109 73 110 91 108 105 C114 112 126 112 132 105 C130 91 131 73 149 75 C174 81 185 101 182 119 C185 144 180 164 159 179 C146 187 130 188 120 188 C110 188 94 187 81 179 C60 164 55 144 58 119 Z"
              />
              <path fill="#3c3c3c" d="M92 97 Q98 83 106 99 Z" />
              <path fill="#3c3c3c" d="M134 99 Q142 83 148 97 Z" />
            </g>
          </g>
          <g ref={faceRef} className="pet-face">
            <circle className="pet-eye" cx="91" cy="140" r="16.5" fill="#141414" stroke="#e8c247" strokeWidth="6.5" />
            <circle className="pet-eye" cx="151" cy="139" r="16.5" fill="#141414" stroke="#e8c247" strokeWidth="6.5" />
            <path fill="#4a4a4a" d="M120 147 L112 152 Q120 156 128 152 Z" />
          </g>
        </g>
      </svg>
    </div>
  )
}
