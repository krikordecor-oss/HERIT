'use client'

import dynamic from 'next/dynamic'

const EarthGlobe = dynamic(
  () => import('../components/EarthGlobe'),
  { ssr: false }
)

export default function Earth() {
  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <style jsx global>{`
        html,
        body {
          margin: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .cesium-viewer,
        .cesium-viewer-cesiumWidgetContainer,
        .cesium-widget,
        .cesium-widget canvas {
          width: 100% !important;
          height: 100% !important;
        }

        .cesium-widget canvas {
          display: block;
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <EarthGlobe />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 32,
          zIndex: 10,
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          pointerEvents: 'none',
          textShadow: '0 2px 10px rgba(0,0,0,.8)',
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 2,
          }}
        >
          HERIT EARTH
        </div>

        <div
          style={{
            marginTop: 5,
            fontSize: 11,
            opacity: 0.7,
            letterSpacing: 1,
          }}
        >
          UNDERSTANDING THE PHYSICAL WORLD
        </div>
      </div>
    </main>
  )
}
