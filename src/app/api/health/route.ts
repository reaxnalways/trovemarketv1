import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || process.env.COMMIT_SHA || "unknown";
  const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown";

  return NextResponse.json(
    {
      ok: true,
      service: "trove-teknoloji",
      environment,
      commit,
      commit_short: commit === "unknown" ? "unknown" : commit.slice(0, 8),
      checked_at: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
