/**
 * Runtime configuration for the browser.
 *
 * `NEXT_PUBLIC_` values are compiled into the bundle, which makes the backend
 * URL a build time decision: change it and the deployed page keeps calling the
 * old one until it is rebuilt. That is a sharp edge when the two services are
 * deployed separately, so the URL is also served from here, where the value is
 * read from the environment on every request.
 *
 * The build time value stays as the fallback, so nothing breaks if this route
 * is unreachable.
 */

export const dynamic = "force-dynamic";

export function GET() {
  const apiBaseUrl =
    process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

  return Response.json(
    { apiBaseUrl: apiBaseUrl.replace(/\/+$/, "") },
    { headers: { "Cache-Control": "no-store" } },
  );
}
