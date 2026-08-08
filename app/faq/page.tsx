'use client'

import dynamic from 'next/dynamic'

const EarthGlobe = dynamic(
  () => import('../components/EarthGlobe'),
  { ssr: false }
)

export default function EarthPage() {
  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <EarthGlobe />
    </main>
  )
}