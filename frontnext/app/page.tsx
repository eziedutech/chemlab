const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-lab-accent">
        WebMCP Challenge
      </p>
      <h1 className="text-4xl font-semibold sm:text-5xl">EZI Lab</h1>
      <p className="text-lg text-slate-300">
        A 3D chemistry and physics lab where an AI agent is the lab instructor,
        powered by WebMCP.
      </p>
      <div className="rounded-lg border border-slate-700 bg-lab-panel p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Scaffold status
        </h2>
        <ul className="mt-3 space-y-1 text-sm text-slate-300">
          <li>Frontend: Next.js 14 App Router, React 18, TypeScript, Tailwind</li>
          <li>Backend health endpoint: {apiBaseUrl}/health</li>
          <li>Next step: WebMCP tool registration</li>
        </ul>
      </div>
    </main>
  );
}
