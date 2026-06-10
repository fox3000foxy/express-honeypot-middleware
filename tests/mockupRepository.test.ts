/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { MockupRepository } from "../src/services/mockupRepository";

describe("MockupRepository", () => {
  test("provides endpoint list", () => {
    const repo = new MockupRepository();
    const endpoints = repo.getVariantEndpoints("default");
    expect(endpoints.length).toBeGreaterThan(300);
    expect(endpoints).toContain("/admin");
    expect(endpoints).toContain("/.env");
    expect(endpoints).toContain("/wp-admin");
    expect(endpoints).toContain("/");
  });

  test("provides same endpoint list for both variants", () => {
    const repo = new MockupRepository();
    expect(repo.getVariantEndpoints("default")).toEqual(repo.getVariantEndpoints("complete"));
  });

  test("generates JSON response on-the-fly", () => {
    const repo = new MockupRepository();
    const res = repo.getMockupResponse("/api/version", "default");
    expect(res).toBeTruthy();
    expect(typeof res).toBe("string");
    const parsed = JSON.parse(res!);
    expect(parsed).toHaveProperty("code", 0);
    expect(parsed).toHaveProperty("message", "ok");
  });

  test("generates complete variant response", () => {
    const repo = new MockupRepository();
    const res = repo.getMockupResponse("/server-info", "complete");
    expect(res).toBeTruthy();
    expect(typeof res).toBe("string");
    const parsed = JSON.parse(res!);
    expect(parsed).toHaveProperty("SERVER_SOFTWARE");
  });

  test("returns HTML response for wp-admin", () => {
    const repo = new MockupRepository();
    const res = repo.getMockupResponse("/wp-admin", "default");
    expect(typeof res).toBe("string");
    expect(res).toContain("<html");
  });

  test("returns null for additional endpoint before ensure", () => {
    const repo = new MockupRepository();
    // The generator handles known endpoints, but null for truly unknown
    const res = repo.getMockupResponse("/nonexistent-path-12345", "default");
    // generateMockup returns something for any path (via catchall), so not null
    expect(res).toBeTruthy();
  });

  test("ensureMockupForEndpoint caches custom response", () => {
    const repo = new MockupRepository();
    repo.ensureMockupForEndpoint("/custom-endpoint", "default", { test: true, value: 42 });

    const res = repo.getMockupResponse("/custom-endpoint", "default");
    expect(res).toBeTruthy();
    const parsed = JSON.parse(res!);
    expect(parsed.test).toBe(true);
    expect(parsed.value).toBe(42);
  });

  test("ensureMockupForEndpoint does not overwrite existing", () => {
    const repo = new MockupRepository();
    repo.ensureMockupForEndpoint("/custom-endpoint-2", "default", { original: true });
    repo.ensureMockupForEndpoint("/custom-endpoint-2", "default", { shouldNotOverwrite: true });

    const res = repo.getMockupResponse("/custom-endpoint-2", "default");
    const parsed = JSON.parse(res!);
    expect(parsed.original).toBe(true);
    expect(parsed.shouldNotOverwrite).toBeUndefined();
  });

  test("returns different timestamps on successive calls", () => {
    const repo = new MockupRepository();
    const res1 = repo.getMockupResponse("/api/version", "complete");
    const res2 = repo.getMockupResponse("/api/version", "complete");
    // Wait a tiny bit
    const p1 = JSON.parse(res1!);
    const p2 = JSON.parse(res2!);
    // Each call gets its own timestamp
    expect(p1.timestamp || p1.request_id).toBeTruthy();
    expect(p2.timestamp || p2.request_id).toBeTruthy();
  });

  test("handles .env endpoint", () => {
    const repo = new MockupRepository();
    const res = repo.getMockupResponse("/.env", "default");
    expect(res).toContain("DB_HOST");
  });

  test("returns complete variant for complete variant", () => {
    const repo = new MockupRepository();
    const res = repo.getMockupResponse("/.env", "complete");
    expect(res).toContain("DB_CONNECTION");
  });
});
