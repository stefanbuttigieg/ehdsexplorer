import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

// Execute the production handler with only its external dependencies replaced.
const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8").replace(/^import .*;\n/gm, "");
const compiled = new Bun.Transpiler({ loader: "ts" }).transformSync(source);

function setup(allowed: boolean) {
  let handler: (request: Request) => Promise<Response> = async () => new Response(null, { status: 500 });
  let providerCalls = 0;
  let databaseCalls = 0;
  const query = {
    select: () => query,
    eq: () => query,
    single: async () => ({ data: null }),
    maybeSingle: async () => ({ data: { article_number: 71, title: "Opt-out", content: "Original text" } }),
  };
  new Function("serve", "requireUser", "createClient", "Deno", "fetch", compiled)(
    (callback: typeof handler) => { handler = callback; },
    async () => allowed ? { userId: "signed-in-user" } : new Response(JSON.stringify({ error: "Sign in required" }), { status: 401 }),
    () => ({ from: () => { databaseCalls++; return query; } }),
    { env: { get: () => "test-configuration" } },
    async () => { providerCalls++; return Response.json({ choices: [{ message: { content: "Simplified text" } }] }); },
  );
  return { run: (body: string) => handler(new Request("https://example.org", { method: "POST", body })), calls: () => ({ providerCalls, databaseCalls }) };
}

describe("plain-language generation access", () => {
  test("signed-out requests cannot trigger paid generation or content reads", async () => {
    const app = setup(false);
    const response = await app.run('{"contentType":"article","contentId":71}');
    expect(response.status).toBe(401);
    expect(app.calls()).toEqual({ providerCalls: 0, databaseCalls: 0 });
  });

  test("authentication is checked even before malformed request parsing", async () => {
    const app = setup(false);
    expect((await app.run("not-json")).status).toBe(401);
    expect(app.calls().providerCalls).toBe(0);
  });

  test("signed-in requests retain generation and returned content", async () => {
    const app = setup(true);
    const response = await app.run('{"contentType":"article","contentId":71}');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ plainLanguageText: "Simplified text", contentType: "article", contentId: 71 });
    expect(app.calls().providerCalls).toBe(1);
  });
});