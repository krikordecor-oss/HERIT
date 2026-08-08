'use client'

import { useEffect, useState } from 'react'

export default function EarthGlobe() {
  const [Globe, setGlobe] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    ;(window as any).CESIUM_BASE_URL = '/cesium/'

    Promise.all([
      import('resium'),
      import('cesium'),
    ]).then(([resium, cesium]) => {
      const { Viewer } = resium
      const {
        ImageryLayer,
        OpenStreetMapImageryProvider,
      } = cesium

      const baseLayer = new ImageryLayer(
        new OpenStreetMapImageryProvider({
          url: 'https://tile.openstreetmap.org/',
        })
      )

      function CesiumGlobe() {
        return (
          <Viewer
            full
            baseLayer={baseLayer}
            animation={false}
            timeline={false}
            geocoder={false}
            homeButton={true}
            sceneModePicker={false}
            navigationHelpButton={false}
            baseLayerPicker={false}
            fullscreenButton={false}
          />
        )
      }

      setGlobe(() => CesiumGlobe)
    })
  }, [])

  if (!Globe) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#020611',
        }}
      />
    )
  }

  return <Globe />
}
