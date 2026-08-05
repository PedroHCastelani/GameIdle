export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">
          🏙️ The Life
        </h1>
        <p className="text-zinc-400 text-lg">
          MMORPG Idle — Policial, Ladrão ou Médico
        </p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 border border-emerald-500/20">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Monorepo operacional
        </div>
      </div>
    </main>
  );
}
