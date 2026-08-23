import { useEffect, useId, useRef } from 'react'

export default function Pet({ size = 140, mood = 'idle', grown = 0 }) {
  const wrapRef = useRef(null)
  const bodyLookRef = useRef(null)
  const faceRef = useRef(null)
  const look = useRef({ x: 0, y: 0 })
  const target = useRef({ x: 0, y: 0 })
  const lastPointer = useRef(0)
  const uid = useId().replace(/:/g, '')

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
  const bodyFilter = `url(#pastel-body-${uid})`
  const eyeFilter = `url(#pastel-eye-${uid})`

  return (
    <div
      ref={wrapRef}
      className={`pet pet-${mood}`}
      style={{ width: size, height: size * 1.12 }}
      aria-label="파를레"
    >
      <svg viewBox="0 0 240 210" width="100%" height="100%" aria-hidden="true">
        <defs>
          <filter id={`pastel-body-${uid}`} x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" seed="3" result="edgeNoise" />
            <feDisplacementMap in="SourceGraphic" in2="edgeNoise" scale="4.2" xChannelSelector="R" yChannelSelector="G" result="rough" />
            <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="3" seed="8" result="paper" />
            <feColorMatrix
              in="paper"
              type="matrix"
              values="0 0 0 0 0.18  0 0 0 0 0.15  0 0 0 0 0.12  0 0 0 0.32 0"
              result="grain"
            />
            <feComposite in="grain" in2="rough" operator="in" result="clippedGrain" />
            <feBlend in="rough" in2="clippedGrain" mode="multiply" result="blended" />
            <feComposite in="blended" in2="rough" operator="in" />
          </filter>
          <filter id={`pastel-eye-${uid}`} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="4" result="eyeNoise" />
            <feDisplacementMap in="SourceGraphic" in2="eyeNoise" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="wobbly" />
            <feTurbulence type="fractalNoise" baseFrequency="1.9" numOctaves="2" seed="11" result="chalk" />
            <feColorMatrix
              in="chalk"
              type="matrix"
              values="0 0 0 0 0.92  0 0 0 0 0.72  0 0 0 0 0.22  0 0 0 0.22 0"
              result="dust"
            />
            <feComposite in="dust" in2="wobbly" operator="in" result="clippedDust" />
            <feBlend in="wobbly" in2="clippedDust" mode="overlay" result="blended" />
            <feComposite in="blended" in2="wobbly" operator="in" />
          </filter>
        </defs>
        <ellipse cx="120" cy="198" rx="58" ry="7" fill="rgba(40, 30, 24, 0.12)" />
        <g style={{ transform: `scale(${scale})`, transformOrigin: '120px 188px' }}>
          <g ref={bodyLookRef} className="pet-body-look">
            <g className="pet-body">
              <path
                fill="#1a1a1a"
                filter={bodyFilter}
                d="M58 119 C55 101 66 81 91 75 C109 73 110 91 108 105 C114 112 126 112 132 105 C130 91 131 73 149 75 C174 81 185 101 182 119 C185 144 180 164 159 179 C146 187 130 188 120 188 C110 188 94 187 81 179 C60 164 55 144 58 119 Z"
              />
              <path fill="#3a3a3a" filter={bodyFilter} d="M92 97 Q98 83 106 99 Z" />
              <path fill="#3a3a3a" filter={bodyFilter} d="M134 99 Q142 83 148 97 Z" />
            </g>
          </g>
          <g ref={faceRef} className="pet-face">
            <path
              className="pet-eye"
              fill="none"
              stroke="#e8c247"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={eyeFilter}
              d="M107.4 137.2 C106.1 146.8 99.2 154.6 91.2 155.4 C82.6 156.3 75.8 148.8 74.9 140.4 C74.1 131.6 80.2 123.4 88.8 122.6 C97.6 121.7 105.2 128.4 107.4 137.2 Z"
            />
            <path
              className="pet-eye"
              fill="none"
              stroke="#e8c247"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={eyeFilter}
              d="M167.2 136.4 C165.8 146.1 158.6 153.8 150.6 154.4 C142.2 155.1 135.6 147.4 134.8 138.8 C134.1 130.2 140.4 122.2 148.8 121.6 C157.6 120.9 165.2 127.4 167.2 136.4 Z"
            />
            <path fill="#4a4a4a" d="M120 147 L112 152 Q120 156 128 152 Z" />
          </g>
        </g>
      </svg>
    </div>
  )
}
