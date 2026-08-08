export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">

      {/* VIDEO / TERRE */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover opacity-70"
        >
          <source src="/earth.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black"></div>

      {/* HUD */}
      <div className="absolute top-10 left-10 tracking-[0.4em] text-cyan-400 text-sm">
        GLOBAL BUILDING INTELLIGENCE
      </div>

      <div className="absolute top-24 left-10">
        <h1 className="text-7xl font-extrabold">
          HERIT
        </h1>

        <p className="mt-6 text-gray-300 max-w-xl text-xl">
          Every Building Has A Story.
        </p>
      </div>

      {/* Status */}
      <div className="absolute bottom-12 left-10 space-y-2 font-mono text-green-400">

        <p>✓ Satellite Network</p>

        <p>✓ Climate Engine</p>

        <p>✓ Digital Twin</p>

        <p>✓ AI Core</p>

      </div>

      {/* ENTER */}
      <div className="absolute bottom-12 right-10">

        <button className="border border-cyan-400 px-10 py-4 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-300">

          ENTER HERIT

        </button>

      </div>

    </main>
  );
}