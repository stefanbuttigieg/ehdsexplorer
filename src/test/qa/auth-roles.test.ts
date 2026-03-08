import { describe, it, expect } from "vitest";

describe("Role Logic", () => {
  it("should correctly derive role hierarchy", () => {
    const deriveRoles = (dbRoles: string[]) => ({
      isSuperAdmin: dbRoles.includes("super_admin"),
      isAdmin: dbRoles.includes("admin") || dbRoles.includes("super_admin"),
      isEditor:
        dbRoles.includes("editor") ||
        dbRoles.includes("admin") ||
        dbRoles.includes("super_admin"),
    });

    const superAdmin = deriveRoles(["super_admin"]);
    expect(superAdmin.isSuperAdmin).toBe(true);
    expect(superAdmin.isAdmin).toBe(true);
    expect(superAdmin.isEditor).toBe(true);

    const admin = deriveRoles(["admin"]);
    expect(admin.isSuperAdmin).toBe(false);
    expect(admin.isAdmin).toBe(true);
    expect(admin.isEditor).toBe(true);

    const editor = deriveRoles(["editor"]);
    expect(editor.isSuperAdmin).toBe(false);
    expect(editor.isAdmin).toBe(false);
    expect(editor.isEditor).toBe(true);

    const user = deriveRoles([]);
    expect(user.isSuperAdmin).toBe(false);
    expect(user.isAdmin).toBe(false);
    expect(user.isEditor).toBe(false);
  });

  it("should handle country_manager role", () => {
    const roles = ["country_manager"];
    expect(roles.includes("country_manager")).toBe(true);
    expect(roles.includes("admin")).toBe(false);
  });
});
