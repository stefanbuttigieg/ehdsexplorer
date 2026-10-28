import { describe, expect, test } from 'bun:test';
import { handleRequest, PUBLIC_RESOURCE, METADATA_PATH } from './mcp-proxy.mjs';

describe('MCP custom-domain proxy', () => {
  test('preserves caller authorization, protocol headers and request body at a fixed destination', async () => {
    let observed: RequestInit | undefined;
    let destination = '';
    const request = new Request(`${PUBLIC_RESOURCE}/?target=https://untrusted.invalid`, {
      method: 'POST', body: '{"jsonrpc":"2.0"}',
      headers: { Authorization: 'Bearer synthetic-test-token', 'Mcp-Session-Id': 'session-test', 'MCP-Protocol-Version': '2025-03-26', 'X-Forwarded-Host': 'untrusted.invalid', Cookie: 'test=value' },
    });
    await handleRequest(request, async (url, init) => {
      destination = url; observed = init;
      return new Response('ok');
    });
    expect(new URL(destination).hostname).toBe('lmjjghvrjgffmbidajih.supabase.co');
    expect(new URL(destination).pathname).toBe('/functions/v1/mcp');
    const headers = new Headers(observed?.headers);
    expect(headers.get('Authorization')).toBe('Bearer synthetic-test-token');
    expect(headers.get('Mcp-Session-Id')).toBe('session-test');
    expect(headers.get('MCP-Protocol-Version')).toBe('2025-03-26');
    expect(headers.get('X-Forwarded-Host')).toBe('mcp.ehdsexplorer.eu');
    expect(headers.has('Cookie')).toBe(false);
    expect(observed?.body).toBe(request.body);
    expect(observed?.redirect).toBe('manual');
    expect(observed?.signal).toBe(request.signal);
  });

  test('streams MCP output without waiting for the whole response', async () => {
    let controller: ReadableStreamDefaultController | undefined;
    const stream = new ReadableStream({ start(value) { controller = value; value.enqueue(new TextEncoder().encode('data: first\n\n')); } });
    const response = await handleRequest(new Request(PUBLIC_RESOURCE), async () => new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Mcp-Session-Id': 'session-test' } }));
    expect(response.headers.get('Mcp-Session-Id')).toBe('session-test');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const reader = response.body?.getReader();
    expect(new TextDecoder().decode((await reader?.read())?.value)).toBe('data: first\n\n');
    controller?.close();
    await reader?.cancel();
  });

  test('rewrites the resource while preserving the authorization issuer', async () => {
    const issuer = 'https://auth.example.test/auth/v1';
    const response = await handleRequest(new Request(`${PUBLIC_RESOURCE}${METADATA_PATH}`), async () => Response.json({ resource: 'https://old.example.test/mcp', authorization_servers: [issuer], bearer_methods_supported: ['header'] }, { headers: { ETag: 'old' } }));
    expect(await response.json()).toEqual({ resource: PUBLIC_RESOURCE, authorization_servers: [issuer], bearer_methods_supported: ['header'] });
    expect(response.headers.has('ETag')).toBe(false);
  });

  test('rewrites only resource_metadata in the authentication challenge', async () => {
    const response = await handleRequest(new Request(PUBLIC_RESOURCE), async () => new Response('unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="EHDS", resource_metadata="https://old.example.test/metadata", error="invalid_token"' } }));
    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toBe(`Bearer realm="EHDS", resource_metadata="${PUBLIC_RESOURCE}${METADATA_PATH}", error="invalid_token"`);
  });

  test('rejects other hosts and paths without forwarding', async () => {
    let calls = 0;
    const upstream = async () => { calls++; return new Response('ok'); };
    expect((await handleRequest(new Request('https://other.example.test/'), upstream)).status).toBe(404);
    expect((await handleRequest(new Request(`${PUBLIC_RESOURCE}/auth/v1/token`), upstream)).status).toBe(404);
    expect(calls).toBe(0);
  });

  test('does not follow upstream redirects or advertise their destination', async () => {
    const response = await handleRequest(new Request(PUBLIC_RESOURCE), async () => new Response(null, { status: 302, headers: { Location: 'https://untrusted.invalid' } }));
    expect(response.status).toBe(502);
    expect(response.headers.has('Location')).toBe(false);
  });
});