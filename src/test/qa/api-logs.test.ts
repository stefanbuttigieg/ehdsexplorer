import { describe, it, expect } from "vitest";

describe("API Log Types & Interfaces", () => {
  it("should have correct ApiLog shape", () => {
    const log = {
      id: "uuid",
      api_key_id: null as string | null,
      user_id: null as string | null,
      endpoint: "/api/obligations",
      method: "GET",
      country_code: "MT" as string | null,
      obligation_id: null as string | null,
      status_code: 200,
      response_message: "OK" as string | null,
      ip_address: null as string | null,
      user_agent: null as string | null,
      request_body: null as Record<string, unknown> | null,
      created_at: new Date().toISOString(),
    };

    expect(log.status_code).toBe(200);
    expect(log.method).toBe("GET");
    expect(log.endpoint).toBe("/api/obligations");
  });

  it("should categorize status codes correctly", () => {
    const isSuccess = (code: number) => code >= 200 && code < 300;
    const isClientError = (code: number) => code >= 400 && code < 500;
    const isServerError = (code: number) => code >= 500;

    expect(isSuccess(200)).toBe(true);
    expect(isSuccess(201)).toBe(true);
    expect(isSuccess(301)).toBe(false);

    expect(isClientError(400)).toBe(true);
    expect(isClientError(401)).toBe(true);
    expect(isClientError(403)).toBe(true);
    expect(isClientError(404)).toBe(true);
    expect(isClientError(500)).toBe(false);

    expect(isServerError(500)).toBe(true);
    expect(isServerError(502)).toBe(true);
    expect(isServerError(400)).toBe(false);
  });

  it("should validate endpoint format", () => {
    const validEndpoints = [
      "/api/obligations",
      "/api/obligations/MT",
      "/api/obligations/MT/obs-1",
    ];

    validEndpoints.forEach((ep) => {
      expect(ep.startsWith("/")).toBe(true);
    });
  });
});

describe("API Log Statistics Calculations", () => {
  it("should calculate time ranges correctly", () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    expect(now.getTime() - oneDayAgo.getTime()).toBe(86400000);
    expect(now.getTime() - oneWeekAgo.getTime()).toBe(604800000);
    expect(oneDayAgo < now).toBe(true);
    expect(oneWeekAgo < oneDayAgo).toBe(true);
  });

  it("should filter logs by time period", () => {
    const now = new Date();
    const logs = [
      { created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), status_code: 200 },
      { created_at: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(), status_code: 200 },
      { created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), status_code: 500 },
    ];

    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last24h = logs.filter((l) => new Date(l.created_at) >= oneDayAgo);
    const errors24h = last24h.filter((l) => l.status_code >= 400);

    expect(last24h).toHaveLength(2);
    expect(errors24h).toHaveLength(1);
  });
});
