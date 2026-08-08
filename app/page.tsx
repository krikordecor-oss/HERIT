'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import BootSequence from './components/BootSequence'
const EarthGlobe = dynamic(
  () => import('./components/EarthGlobe'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-black" />
    ),
  }
)

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
<div className="animate-fade-in">
    <EarthGlobe />
    <BootSequence />
</div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/40" />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

      <div className="pointer-events-none absolute inset-0 opacity-20 bg-[linear-gradient(rgba(0,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,.08)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <header className="pointer-events-none absolute left-8 top-8 z-10">
        <p className="font-mono text-xs tracking-[0.4em] text-cyan-400">
          WORLD HERITAGE INTELLIGENCE
        </p>

        <h1 className="mt-5 text-8xl font-black tracking-[0.35em]">
          HERIT
        </h1>

        <p className="mt-3 text-sm tracking-[0.25em] text-cyan-200">
GLOBAL MEMORY OF HUMAN HERITAGE
        </p>
      </header>

      <div className="pointer-events-none absolute bottom-8 left-8 rounded-lg border border-cyan-500/30 bg-black/40 p-4 backdrop-blur-md">

<p className="font-mono text-cyan-300 mb-3">
SYSTEM STATUS
</p>

<p>🛰 SATELLITES .......... 08</p>

<p>🌍 BUILDINGS .... 1 842 536</p>

<p>📚 MEMORY ........ ACTIVE</p>

<p>🧠 AI ................. ONLINE</p>

<p>⚖ ETHICS ........ ENABLED</p>

</div>

      <div className="absolute bottom-8 right-8 z-20">
        <Link
          href="/earth"
          className="block border border-cyan-400 bg-black/40 px-10 py-4 text-sm tracking-[0.3em] text-cyan-300 backdrop-blur-md transition duration-300 hover:bg-cyan-400 hover:text-black"
        >
          INITIALIZE MISSION
        </Link>
      </div>

      <div className="pointer-events-none absolute right-8 top-8 z-10 text-right font-mono text-[10px] tracking-[0.2em] text-cyan-400/70">
<div className="rounded-lg border border-cyan-500/30 bg-black/40 p-4 backdrop-blur-md">

    <p className="text-cyan-300">MISSION STATUS</p>

    <div className="mt-4 space-y-2">

        <p>🟢 AI ONLINE</p>

        <p>🟢 GEO DNA READY</p>

        <p>🟢 MEMORY ENGINE</p>

        <p>🟢 24 DATA SOURCES</p>

        <p>🟢 ETHICS ENABLED</p>

    </div>

</div>
      </div>
      {/* HERIT BOOT */}

<div className="absolute inset-0 pointer-events-none flex items-center justify-center">

    <div className="absolute top-8 left-8 font-mono text-cyan-400 text-xs tracking-[0.25em]">
        INITIALIZING HERIT...
    </div>

    <div className="absolute top-16 left-8 space-y-2 font-mono text-xs">

        <p className="text-cyan-400">✔ SATELLITES ONLINE</p>

        <p className="text-cyan-400">✔ GEO DNA READY</p>

        <p className="text-cyan-400">✔ MEMORY ENGINE READY</p>

        <p className="text-cyan-400">✔ TIME ENGINE READY</p>

        <p className="text-cyan-400">✔ AI ONLINE</p>

    </div>

</div>

    </main>
  )
}