import { describe, it, expect } from "vitest";

// Test the ROUTE_TO_PLACEMENT mapping used in Layout.tsx
const ROUTE_TO_PLACEMENT: Record<string, string> = {
  '/': 'home',
  '/articles': 'articles',
  '/recitals': 'recitals',
  '/definitions': 'definitions',
  '/implementing-acts': 'implementing_acts',
  '/annexes': 'annexes',
  '/news': 'news',
  '/for-citizens': 'for_citizens',
  '/for-healthcare': 'for_healthcare',
  '/for-healthtech': 'for_healthtech',
  '/health-authorities': 'health_authorities',
  '/cross-regulation': 'cross_regulation',
  '/games': 'games',
  '/tools': 'tools',
};

describe("Layout Route-to-Placement Mapping", () => {
  it("should map all major public routes to placement keys", () => {
    expect(ROUTE_TO_PLACEMENT['/']).toBe('home');
    expect(ROUTE_TO_PLACEMENT['/articles']).toBe('articles');
    expect(ROUTE_TO_PLACEMENT['/recitals']).toBe('recitals');
    expect(ROUTE_TO_PLACEMENT['/definitions']).toBe('definitions');
    expect(ROUTE_TO_PLACEMENT['/implementing-acts']).toBe('implementing_acts');
    expect(ROUTE_TO_PLACEMENT['/annexes']).toBe('annexes');
    expect(ROUTE_TO_PLACEMENT['/news']).toBe('news');
  });

  it("should return undefined for unmapped routes", () => {
    expect(ROUTE_TO_PLACEMENT['/admin']).toBeUndefined();
    expect(ROUTE_TO_PLACEMENT['/profile']).toBeUndefined();
    expect(ROUTE_TO_PLACEMENT['/bookmarks']).toBeUndefined();
  });

  it("should have consistent naming convention (snake_case for placements)", () => {
    Object.values(ROUTE_TO_PLACEMENT).forEach((placement) => {
      expect(placement).toMatch(/^[a-z_]+$/);
    });
  });
});
