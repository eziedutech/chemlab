import { PageShell } from "../components/dashboard/PageShell";

// Inlined at build time, so a change of backend URL means a rebuild.
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export default function Home() {
  return <PageShell apiBaseUrl={apiBaseUrl} />;
}
