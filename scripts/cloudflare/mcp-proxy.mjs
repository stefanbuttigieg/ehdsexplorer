// Dedicated MCP reverse proxy, not hosting for the EHDS Explorer website.
export const PUBLIC_RESOURCE = 'https://mcp.ehdsexplorer.eu';
export const METADATA_PATH = '/.well-known/oauth-protected-resource';
const UPSTREAM = 'https://lmjjghvrjgffmbidajih.supabase.co/functions/v1/mcp';
const UPSTREAM_METADATA = `${UPSTREAM}/.well-known/oauth-protected-resource`;
const METADATA_ALIASES = new Set([
  METADATA_PATH,
  '/functions/v1/mcp/.well-known/oauth-protected-resource',
]);
const METHODS = new Set(['GET', 'POST', 'DELETE', 'OPTIONS']);

function privateHeaders(headers) {
  const copy = new Headers(headers);
  copy.set('Cache-Control', 'no-store');
  copy.set('X-Content-Type-Options', 'nosniff');
  return copy;
}

export async function handleRequest(request, upstreamFetch = fetch) {
  const url = new URL(request.url);
  if (url.origin !== PUBLIC_RESOURCE) return new Response('Not found', { status: 404 });
  const metadata = METADATA_ALIASES.has(url.pathname);
  if (url.pathname !== '/' && !metadata) return new Response('Not found', { status: 404 });
  if (!METHODS.has(request.method) || (metadata && !['GET', 'OPTIONS'].includes(request.method))) {
    return new Response('Method not allowed', { status: 405, headers: { Allow: metadata ? 'GET, OPTIONS' : 'GET, POST, DELETE, OPTIONS' } });
  }

  const target = new URL(metadata ? UPSTREAM_METADATA : UPSTREAM);
  // Query parameters never select the destination or a different upstream path.
  target.search = url.search;
  const headers = new Headers(request.headers);
  for (const name of Array.from(headers.keys())) {
    if (name === 'host' || name === 'forwarded' || name.startsWith('x-forwarded-') ||
        name === 'cookie' || name === 'connection' || name === 'proxy-authorization' ||
        name === 'proxy-connection' || name === 'transfer-encoding' || name === 'upgrade') {
      headers.delete(name);
    }
  }
  headers.set('X-Forwarded-Proto', 'https');
  headers.set('X-Forwarded-Host', 'mcp.ehdsexplorer.eu');

  let response;
  try {
    response = await upstreamFetch(target.href, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'manual',
      signal: request.signal,
    });
  } catch {
    return new Response('MCP service unavailable', { status: 502, headers: privateHeaders() });
  }
  const output = privateHeaders(response.headers);
  output.delete('Set-Cookie');
  if (response.status >= 300 && response.status < 400) {
    // Do not follow or advertise redirects that could send caller tokens elsewhere.
    await response.body?.cancel();
    return new Response('Unexpected upstream redirect', { status: 502, headers: privateHeaders() });
  }
  const challenge = output.get('WWW-Authenticate');
  if (challenge) {
    output.set('WWW-Authenticate', challenge.replace(
      /\bresource_metadata\s*=\s*"(?:[^"\\]|\\.)*"/gi,
      `resource_metadata="${PUBLIC_RESOURCE}${METADATA_PATH}"`,
    ));
  }

  if (metadata && response.ok && request.method === 'GET') {
    try {
      const document = await response.json();
      if (!document || typeof document !== 'object' || Array.isArray(document) ||
          !Array.isArray(document.authorization_servers)) throw new Error('Invalid metadata');
      // Keep the real authorization issuer, endpoints and all other fields intact.
      document.resource = PUBLIC_RESOURCE;
      for (const name of ['Content-Length', 'Content-Encoding', 'ETag', 'Content-MD5', 'Digest']) output.delete(name);
      output.set('Content-Type', 'application/json');
      return new Response(JSON.stringify(document), { status: response.status, headers: output });
    } catch {
      return new Response('MCP discovery unavailable', { status: 502, headers: privateHeaders() });
    }
  }
  // Never buffer ordinary MCP output: SSE, session headers and errors pass through.
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: output });
}

export default { fetch: request => handleRequest(request) };