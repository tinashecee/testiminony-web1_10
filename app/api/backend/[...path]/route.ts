import { NextRequest } from "next/server";

const TARGET_BASE =
  process.env.BACKEND_BASE_URL || "http://41.220.20.218:5000";

function buildTargetUrl(path: string[], req: NextRequest): string {
  const joinedPath = path?.length ? `/${path.join("/")}` : "";
  const search = req.nextUrl.search ? req.nextUrl.search : "";
  console.log(`[Proxy] Forwarding to: ${TARGET_BASE}`);
  return `${TARGET_BASE}${joinedPath}${search}`;
}

async function forward(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  // Spoof Origin and Referer to match the target backend
  // This prevents the backend from rejecting requests from new frontend domains
  try {
    const targetUrlObj = new URL(TARGET_BASE);
    headers.set("origin", targetUrlObj.origin);
    // Optional: set referer to origin or specific path if needed
    headers.set("referer", targetUrlObj.origin + "/");
  } catch (e) {
    console.warn("Failed to set origin/referer based on TARGET_BASE:", e);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
    // @ts-expect-error: duplex is required by Node fetch for streaming bodies
    duplex: "half",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body as any;
  }

  // Primary request
  let targetUrl = buildTargetUrl(path, req);
  let res: Response;

  try {
    res = await fetch(targetUrl, init);

    // Fallback: try with "/api" prefix if upstream returns 404 and base doesn't already include it
    const baseHasApi =
      /\/api\/?$/.test(TARGET_BASE) || /\/api\//.test(TARGET_BASE);
    if (
      res.status === 404 &&
      !baseHasApi &&
      (req.method === "GET" || req.method === "HEAD")
    ) {
      const joinedPath = path?.length ? `/${path.join("/")}` : "";
      const search = req.nextUrl.search ? req.nextUrl.search : "";
      const fallbackUrl = `${TARGET_BASE}/api${joinedPath}${search}`;
      try {
        const fallbackRes = await fetch(fallbackUrl, init);
        if (fallbackRes.ok || fallbackRes.status !== 404) {
          res = fallbackRes;
          targetUrl = fallbackUrl;
        }
      } catch (fallbackError) {
        console.warn("Fallback fetch failed:", fallbackError);
        // Ignore fallback error and stick with original 404 response
      }
    }
  } catch (error) {
    console.error(`Proxy fetch failed for ${targetUrl}:`, error);
    return new Response(
      JSON.stringify({
        error: "Backend Service Unavailable",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete("access-control-allow-origin");
  responseHeaders.delete("access-control-allow-credentials");

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forward(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forward(req, context);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forward(req, context);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forward(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forward(req, context);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function OPTIONS(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forward(req, context);
}
