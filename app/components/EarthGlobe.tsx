'use client'

import { Viewer } from 'resium'
import {
  Ion,
  createWorldTerrainAsync,
  OpenStreetMapImageryProvider,
} from 'cesium'

import 'cesium/Build/Cesium/Widgets/widgets.css'

Ion.defaultAccessToken = ''

export default function EarthGlobe() {
  return (
    <Viewer
      full
      baseLayer={new OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/',
      })}
      terrain={createWorldTerrainAsync()}
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