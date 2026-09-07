const HAS_FILE_EXT = /\.[a-z0-9]+$/i;

async function markdownResponse(request, env) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return null;
  }

  const accept = request.headers.get("Accept") || "";
  if (!/\btext\/markdown\b/i.test(accept)) {
    return null;
  }

  const url = new URL(request.url);
  let path = url.pathname;
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  if (path !== "/" && HAS_FILE_EXT.test(path)) {
    return null;
  }

  const mdPath = path === "/" || path === "" ? "/index.md" : `${path}/index.md`;
  const assetResponse = await env.ASSETS.fetch(new Request(new URL(mdPath, url.origin), { method: "GET" }));
  if (!assetResponse.ok) {
    return null;
  }

  const body = await assetResponse.text();
  const tokens = Math.max(1, Math.ceil(body.length / 4));
  return new Response(request.method === "HEAD" ? null : body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      "x-markdown-tokens": String(tokens),
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export default {
  async fetch(request, env) {
    const negotiated = await markdownResponse(request, env);
    if (negotiated) {
      return negotiated;
    }
    return env.ASSETS.fetch(request);
  },
};
