'use client'

import { useEffect, useMemo } from 'react'
import { Viewer } from 'resium'
import {
  ImageryLayer,
  OpenStreetMapImageryProvider,
} from 'cesium'

;(window as any).CESIUM_BASE_URL = '/cesium/'

export default function EarthGlobe() {
  const baseLayer = useMemo(
    () =>
      new ImageryLayer(
        new OpenStreetMapImageryProvider({
          url: 'https://tile.openstreetmap.org/',
        })
      ),
    []
  )

  useEffect(() => {
    const cssId = 'cesium-widgets-css'

    if (!document.getElementById(cssId)) {
      const link = document.createElement('link')
      link.id = cssId
      link.rel = 'stylesheet'
      link.href = '/cesium/Widgets/widgets.css'
      document.head.appendChild(link)
    }
  }, [])

  return (
    <div className="absolute inset-0">
      <Viewer
        full
        baseLayer={baseLayer}
        animation={false}
        timeline={false}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        sceneModePicker={false}
        navigationHelpButton={false}
        fullscreenButton={false}
        infoBox={false}
        selectionIndicator={false}
      />
    </div>
  )
}