import { AgentActivityIndicator } from "../components/AgentActivityIndicator";
import { ToolList } from "../components/dashboard/ToolList";
import { WebMcpStatusBadge } from "../components/dashboard/WebMcpStatusBadge";
import { WebMcpRegistrar } from "../components/webmcp/WebMcpRegistrar";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-7 px-6 py-14">
      <WebMcpRegistrar />

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            WebMCP Challenge
          </p>
          <WebMcpStatusBadge />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          EZI Lab
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-slate-300">
          A 3D chemistry and physics lab where an AI agent is the lab
          instructor, powered by WebMCP.
        </p>
      </header>

      <section className="glass-panel p-6">
        <h2 className="text-sm font-medium tracking-wide text-slate-200">
          Registered tools
        </h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Ask the agent to list its available tools. The names below are what it
          should answer with.
        </p>
        <div className="mt-5">
          <ToolList />
        </div>
      </section>

      <section className="glass-panel p-6">
        <h2 className="text-sm font-medium tracking-wide text-slate-200">
          Build status
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-[auto,1fr] sm:gap-x-6">
          <dt className="text-slate-400">Frontend</dt>
          <dd className="text-slate-200">
            Next.js 14 App Router, React 18, TypeScript, Tailwind
          </dd>
          <dt className="text-slate-400">Backend health</dt>
          <dd className="font-mono text-slate-200">{apiBaseUrl}/health</dd>
          <dt className="text-slate-400">Next step</dt>
          <dd className="text-slate-200">
            3D scene and the reaction lookup table
          </dd>
        </dl>
      </section>

      <AgentActivityIndicator />
    </main>
  );
}
