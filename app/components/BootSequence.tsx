'use client'

import { useEffect, useState } from 'react'

const steps = [
  'CONNECTING SATELLITES...',
  'LOADING GEO DNA...',
  'LOADING MEMORY ENGINE...',
  'LOADING TIME ENGINE...',
  'LOADING ETHICS ENGINE...',
  'AI ONLINE'
]

export default function BootSequence() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index >= steps.length - 1) return

    const timer = setTimeout(() => {
      setIndex(index + 1)
    }, 600)

    return () => clearTimeout(timer)
  }, [index])

  return (
    <div className="absolute inset-0 pointer-events-none z-50">

      <div className="absolute left-12 top-1/2 -translate-y-1/2">

        <p className="font-mono text-cyan-400 tracking-[0.35em] text-xs">
          HERIT INITIALIZATION
        </p>

        <div className="mt-6 space-y-2">

          {steps.map((step, i) => (
            <p
              key={step}
              className={`font-mono transition-all duration-500 ${
                i <= index
                  ? 'text-emerald-400 opacity-100'
                  : 'text-gray-700 opacity-30'
              }`}
            >
              {i <= index ? '✔' : '○'} {step}
            </p>
          ))}

        </div>

      </div>

    </div>
  )
}