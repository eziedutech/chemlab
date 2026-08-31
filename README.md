# EZI ChemLab

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

EZI ChemLab is a browser based 3D lab for those students. It covers three locked
topics from the Indonesian secondary curriculum: acid and base reactions,
electrolyte versus non electrolyte solutions, and density with Archimedes'
principle. What makes it different from a video or a slideshow is that an AI
agent drives it. Through WebMCP the agent switches experiments, mixes
substances, reads the current state of the beaker, raises educational safety
alerts, explains each reaction step, and writes the lab report at the end. The
student talks to the agent, and the simulation responds.

## For judges: how to test

Live URL: **https://chemlab.eziedutech.dev/?lang=en**

No account and no login are required, and the app is free to use. The `lang=en`
parameter opens the interface in English; without it the page opens in
Indonesian, which is the classroom default, and the toggle in the header
switches at any time.

1. Open the live URL in the ChatGPT desktop app in-app browser, which supports
   WebMCP by default. As an alternative, use Chrome 149 or newer with
   `chrome://flags/#enable-webmcp-testing` enabled, then restart the browser.
2. Confirm the WebMCP status badge in the app reads as detected, with a tool
   count of seven.
3. Ask the agent to list its available tools, then paste the starter prompt from
   the app's "Copy starter prompt" button. The prompt is also printed on the
   page, so it can be selected by hand if the clipboard is blocked.
4. Watch the 3D scene: every agent tool call raises a visible toast naming the
   tool that ran. A call started from the manual runner instead of an agent
   says "run by hand", so the two are never confused.

If the browser has no WebMCP support at all, the page still works: the badge
says so, and the manual tool runner near the bottom executes the same tool
descriptors, with the same structured results.

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

There are three compose files, and which one to use depends on how the
deployment is organised. Neither arrangement needs build arguments: the
frontend reads `API_BASE_URL` from its environment at runtime through
`/runtime-config`.

| File | Use it when |
|---|---|
| `docker-compose.yml` | Running locally. Publishes host ports |
| `docker-compose.prod.yml` | One deployment unit runs both services |
| `docker-compose.backrust.yml` and `docker-compose.frontnext.yml` | Each service is its own deployment unit, with its own environment and its own logs |

Splitting them is safe because the two never talk to each other over a private
network: the browser calls the API on its public hostname.

Two services, on two hostnames:

| Service | Hostname |
|---|---|
| `frontnext` | `chemlab.eziedutech.dev` |
| `backrust` | `apichemlab.eziedutech.dev` |

Both are single label subdomains on purpose. The certificate at the Cloudflare
edge covers `*.eziedutech.dev` and that wildcard is one level deep, so a name
like `api.chemlab.eziedutech.dev` would not be covered.

1. Point both hostnames at the VPS with an A record before deploying, so a
   certificate can be issued for each of them.
2. Create the two services from this repository and set their environment:

   ```
   # backrust
   LLM_BASE_URL=https://api.openai.com/v1
   LLM_MODEL=gpt-4o-mini
   LLM_API_KEY=<provider key>
   ALLOWED_ORIGINS=https://chemlab.eziedutech.dev

   # frontnext
   API_BASE_URL=https://apichemlab.eziedutech.dev
   ```

3. `LLM_API_KEY` belongs to the backend only and is never exposed to the
   browser.
4. Point the backend healthcheck at `GET /health`.
5. Keep `ALLOWED_ORIGINS` set to the frontend origin, so CORS is restricted
   rather than wildcarded. Leaving it empty falls back to permissive, which is
   for local development only.
6. `API_BASE_URL` takes effect on restart. `NEXT_PUBLIC_API_BASE_URL` is the
   build time fallback, and changing that one does need a rebuild, since
   `NEXT_PUBLIC_` values are compiled into the bundle.

Use `docker-compose.prod.yml` for the deployment rather than the file used
locally. They differ in one thing that matters on a shared machine: the
production file publishes no host ports, and lets the reverse proxy reach each
container over the shared network instead.

Pushing to `main` redeploys. In the Compose service, set the provider to this
repository with branch `main`, compose path `./docker-compose.prod.yml`, and
trigger type `On Push`, then turn Autodeploy on. With the GitHub app connected
the webhook is created for you, so nothing has to be added to the repository by
hand.

Pointing the frontend at a different backend later is a change to
`API_BASE_URL` and a restart, not a rebuild.

## Configuration

| Variable | Service | Description |
|---|---|---|
| `LLM_BASE_URL` | backrust | Base URL of an OpenAI compatible provider |
| `LLM_MODEL` | backrust | Model name as the provider spells it |
| `LLM_API_KEY` | backrust | Provider credential, server side only |
| `LLM_BASE_URL_2`, `LLM_MODEL_2`, `LLM_API_KEY_2` | backrust | A second provider, tried when the first fails |
| `LLM_BASE_URL_3`, `LLM_MODEL_3`, `LLM_API_KEY_3` | backrust | A third, and so on up to five |
| `ALLOWED_ORIGINS` | backrust | Comma separated CORS origins for production |
| `API_BASE_URL` | frontnext | Base URL of the backend, read at runtime. Preferred |
| `NEXT_PUBLIC_API_BASE_URL` | frontnext | Same thing baked in at build time, used as the fallback |

The backend is provider agnostic. Any endpoint that implements
`POST /v1/chat/completions` in the OpenAI format works, so switching providers is
an environment change and not a code change.

More than one can be configured. Numbered sets are tried in order, and a
provider that is out of quota, unreachable, or slow is passed over for the next
one, which matters when judging runs for three weeks on a single account. When
every one of them fails the report still comes back, assembled from the
student's own observations. `GET /health` reports how many are configured, and a
report that a model wrote names the model in its `model` field.

## Curriculum coverage

Topics are mapped to the Indonesian Kurikulum Merdeka by phase.

| Topic | Phase | What the student observes |
|---|---|---|
| Acids, bases and indicators | Phase F | Indicator colour change, carbon dioxide bubbles |
| Electrolyte and non electrolyte solutions | Phase E | Lamp glowing bright, dim, or not at all |
| Density and Archimedes' principle | Phase D | An egg sinking in fresh water and floating in salt water |

## Credits and licenses

There are no third party assets. Every piece of geometry on the page is built
in code: the room and its benches and shelving, the glassware, which is turned
on a lathe from a profile the way the real thing is, the liquid, the bubbles,
the electrodes, the lamp, the spatula and the egg.

## License

Released under the MIT License. See [LICENSE](LICENSE).
