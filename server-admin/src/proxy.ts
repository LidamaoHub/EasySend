import { NextRequest, NextResponse } from "next/server";

function buildCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "*";
  const requestHeaders =
    request.headers.get("access-control-request-headers") ?? "Content-Type, Authorization";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": requestHeaders,
    "Access-Control-Expose-Headers": "Content-Disposition",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin, Access-Control-Request-Headers",
  };
}

export function proxy(request: NextRequest) {
  const corsHeaders = buildCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
