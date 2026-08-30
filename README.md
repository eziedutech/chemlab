# EZI Lab

> A 3D science lab where an AI agent is the lab instructor, powered by WebMCP.

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![Rust](https://img.shields.io/badge/Rust-axum%200.7-orange.svg)](https://www.rust-lang.org)

## Table of Contents

- [What it is](#what-it-is)
- [For judges: how to test](#for-judges-how-to-test)
- [WebMCP tools](#webmcp-tools)
- [Architecture](#architecture)
- [Running locally](#running-locally)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Curriculum coverage](#curriculum-coverage)
- [Credits and licenses](#credits-and-licenses)
- [License](#license)

## What it is

Many secondary schools do not have a chemistry or physics lab that is complete
enough, or safe enough, for students to run experiments on their own. Reagents
cost money, glassware breaks, and a teacher cannot supervise thirty students
pouring acid at the same time. The practical work that makes science click is
often the first thing that gets cut.

EZI Lab is a browser based 3D lab for those students. It covers three locked
topics from the Indonesian secondary curriculum: acid and base reactions,
electrolyte versus non electrolyte solutions, and density with Archimedes'
principle. What makes it different from a video or a slideshow is that an AI
agent drives it. Through WebMCP the agent switches experiments, mixes
substances, reads the current state of the beaker, raises educational safety
alerts, explains each reaction step, and writes the lab report at the end. The
student talks to the agent, and the simulation responds.

## For judges: how to test

No account and no login are required, and the app is free to use.

1. Open the live URL in the ChatGPT desktop app in-app browser, which supports
   WebMCP by default. As an alternative, use Chrome 149 or newer with
   `chrome://flags/#enable-webmcp-testing` enabled, then restart the browser.
2. Confirm the WebMCP status badge in the app reads as detected, with a tool
   count of seven.
3. Ask the agent to list its available tools, then paste the starter prompt from
   the app's "Copy starter prompt" button.
4. Watch the 3D scene: every agent tool call raises a visible toast that names
   the tool that was called.

Live URL and the starter prompt text are added here once the deployment is live.

## WebMCP tools

Seven tools are registered on the page. The table is filled in as each tool
lands.

| Tool | What it does | Returns |
|---|---|---|
| `switch_experiment_mode` | Switches the active subject and topic, and swaps the 3D scene | Active topic, scene name, available substances, suggested next step |
| `mix_substances` | Measures each reagent out on the bench, adds them to the beaker one at a time, and applies the reaction | Reaction id, what was measured into which vessel, visual state, temperature change, observation in both languages, animation duration |
| `explain_reaction_step` | Explains one step of the reaction to the student | Step number, explanation, total steps |
| `render_lab_report` | Composes the observation report after the experiment | Formatted report, learning points |
| `trigger_safety_alert` | Shows an educational safety banner | Severity, auto dismiss timing |
| `get_lab_state` | Reads the current lab state before deciding the next step | Topic, beaker contents, colour, temperature, lamp, floating object, whether the scene is busy, observation log |
| `reset_experiment` | Empties the beaker and restarts the current topic | Active topic, cleared flag |

Registration itself lives in
[`frontnext/lib/webmcp/registerTools.ts`](frontnext/lib/webmcp/registerTools.ts)
and runs from a `useEffect` in a client component, never at module load, because
`document` does not exist during server rendering:

```ts
export function registerTools(): RegistrationResult {
  const modelContext = getModelContext();

  if (!modelContext) {
    return { detected: false, registered: [], unregister: () => {} };
  }

  for (const tool of toolDescriptors) {
    modelContext.unregisterTool?.(tool.name);
    modelContext.registerTool(tool);
  }

  return {
    detected: true,
    registered: [...toolNames],
    unregister: () => {
      for (const tool of toolDescriptors) {
        modelContext.unregisterTool?.(tool.name);
      }
    },
  };
}
```

Two details are deliberate. Each tool is unregistered before it is registered, so
React StrictMode mounting the effect twice cannot produce duplicates. And the
entry point is resolved through `getModelContext()`, which reads
`document.modelContext` first and falls back to `navigator.modelContext`, because
the specification moved between those two locations in July 2026 and browsers in
the wild expose either one. When neither exists the app keeps running and the
status badge reports that WebMCP was not detected.

## Architecture

```
ChatGPT agent
      |  WebMCP tool calls
      v
Browser page (Next.js 14 App Router, React 18)
      |-- lib/webmcp        tool registration and structured results
      |-- lib/reactions     static reaction lookup table
      |-- components/scene  React Three Fiber scene
      |-- store/labStore    Zustand state
      |
      |  HTTP (JSON)
      v
backrust (Rust, axum 0.7)
      |-- GET  /health
      |-- POST /api/generate-explanation   served from pre-generated static text
      |-- POST /api/generate-lab-report    live call to the LLM provider
      |
      v
OpenAI compatible chat completions endpoint
```

One decision is worth calling out: reaction outcomes come from a static lookup
table in the frontend, never from a language model. The model writes narration
only. That keeps the science correct and makes the simulation reproducible.

## Running locally

Prerequisites: Docker with the Compose plugin, or Node 20 and Rust 1.85 or newer
for the non Docker path.

With Docker:

```bash
cp .env.example .env
docker compose up --build
```

The frontend is then served at `http://localhost:3000` and the backend at
`http://localhost:8080`. Verify the backend with:

```bash
curl http://localhost:8080/health
```

which returns `{"status":"ok","version":"0.1.0"}`.

Without Docker, in two terminals:

```bash
cd backrust && cargo run
```

```bash
cd frontnext && npm install && npm run dev
```

## Deployment

The project is deployed with Dokploy on a self hosted VPS, with HTTPS issued by
Let's Encrypt.

1. Create two Docker Compose services from this repository, `frontnext` and
   `backrust`.
2. Set the environment variables from the table below. `LLM_API_KEY` belongs to
   the backend service only and is never exposed to the browser.
3. Point the backend healthcheck at `GET /health`.
4. Set `ALLOWED_ORIGINS` on the backend to the production frontend origin, so
   CORS is restricted rather than wildcarded.
5. Rebuild the frontend whenever `NEXT_PUBLIC_API_BASE_URL` changes, because
   `NEXT_PUBLIC_` values are inlined at build time and not read at runtime.

## Configuration

| Variable | Service | Description |
|---|---|---|
| `LLM_BASE_URL` | backrust | Base URL of an OpenAI compatible provider |
| `LLM_MODEL` | backrust | Model name as the provider spells it |
| `LLM_API_KEY` | backrust | Provider credential, server side only |
| `ALLOWED_ORIGINS` | backrust | Comma separated CORS origins for production |
| `NEXT_PUBLIC_API_BASE_URL` | frontnext | Base URL of the backend, inlined at build time |

The backend is provider agnostic. Any endpoint that implements
`POST /v1/chat/completions` in the OpenAI format works, so switching providers is
an environment change and not a code change.

## Curriculum coverage

Topics are mapped to the Indonesian Kurikulum Merdeka by phase.

| Topic | Phase | What the student observes |
|---|---|---|
| Acids, bases and indicators | Phase F | Indicator colour change, carbon dioxide bubbles |
| Electrolyte and non electrolyte solutions | Phase E | Lamp glowing bright, dim, or not at all |
| Density and Archimedes' principle | Phase D | An egg sinking in fresh water and floating in salt water |

## Credits and licenses

Third party 3D assets and their CC BY attributions are listed in
[ATTRIBUTION.md](ATTRIBUTION.md), added alongside the assets themselves.

## License

Released under the MIT License. See [LICENSE](LICENSE).
