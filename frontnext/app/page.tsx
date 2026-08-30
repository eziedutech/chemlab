import { AgentActivityIndicator } from "../components/AgentActivityIndicator";
import { ToolList } from "../components/dashboard/ToolList";
import { WebMcpStatusBadge } from "../components/dashboard/WebMcpStatusBadge";
import { WebMcpRegistrar } from "../components/webmcp/WebMcpRegistrar";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <WebMcpRegistrar />

      <header className="flex flex-col gap-4">
        <p className="text-sm uppercase tracking-[0.3em] text-lab-accent">
          WebMCP Challenge
        </p>
        <h1 className="text-4xl font-semibold sm:text-5xl">EZI Lab</h1>
        <p className="text-lg text-slate-300">
          A 3D chemistry and physics lab where an AI agent is the lab
          instructor, powered by WebMCP.
        </p>
        <div>
          <WebMcpStatusBadge />
        </div>
      </header>

      <section className="rounded-lg border border-slate-700 bg-lab-panel p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Registered tools
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Ask the agent to list its available tools. The names below are what it
          should answer with.
        </p>
        <div className="mt-4">
          <ToolList />
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-lab-panel p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Scaffold status
        </h2>
        <ul className="mt-3 space-y-1 text-sm text-slate-300">
          <li>Frontend: Next.js 14 App Router, React 18, TypeScript, Tailwind</li>
          <li>Backend health endpoint: {apiBaseUrl}/health</li>
          <li>Next step: 3D scene and the reaction lookup table</li>
        </ul>
      </section>

      <AgentActivityIndicator />
    </main>
  );
}
