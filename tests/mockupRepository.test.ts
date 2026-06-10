/// <reference types="bun-types" />
import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import path from "path";
import os from "os";
import { MockupRepository } from "../src/services/mockupRepository";

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "honeypot-test-"));

  fs.mkdirSync(path.join(tmpDir, "default", "admin"), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, "default", ".env"), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, "default", "wp-admin"), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, "complete", "admin"), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, "complete", "server-info"), { recursive: true });

  fs.writeFileSync(path.join(tmpDir, "default", "admin", "index.mock"), JSON.stringify({ status: "ok", role: "admin" }));
  fs.writeFileSync(path.join(tmpDir, "default", ".env", "index.mock"), JSON.stringify({ DB_HOST: "localhost" }));
  fs.writeFileSync(path.join(tmpDir, "default", "index.mock"), "<html>root</html>");
  fs.writeFileSync(
    path.join(tmpDir, "default", "wp-admin", "index.mock"),
    "<html><body><h1>WP Admin</h1></body></html>",
  );
  fs.writeFileSync(path.join(tmpDir, "complete", "admin", "index.mock"), JSON.stringify({ status: "complete_admin" }));
  fs.writeFileSync(
    path.join(tmpDir, "complete", "server-info", "index.mock"),
    JSON.stringify({ server: "Apache", version: "2.4" }),
  );
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("MockupRepository", () => {
  test("preloads default variant endpoints", () => {
    const repo = new MockupRepository(tmpDir);
    const endpoints = repo.getVariantEndpoints("default");
    expect(endpoints).toContain("/admin");
    expect(endpoints).toContain("/.env");
    expect(endpoints).toContain("/wp-admin");
    expect(endpoints).toContain("/");
  });

  test("preloads complete variant endpoints", () => {
    const repo = new MockupRepository(tmpDir);
    const endpoints = repo.getVariantEndpoints("complete");
    expect(endpoints).toContain("/admin");
    expect(endpoints).toContain("/server-info");
  });

  test("returns empty array for missing variant", () => {
    const repo = new MockupRepository(tmpDir);
    expect(repo.getVariantEndpoints("default" as any)).toBeDefined();
  });

  test("returns JSON response from cache", () => {
    const repo = new MockupRepository(tmpDir);
    const res = repo.getMockupResponse("/admin", "default") as any;
    expect(res.status).toBe("ok");
    expect(res.role).toBe("admin");
  });

  test("returns string response from cache", () => {
    const repo = new MockupRepository(tmpDir);
    expect(repo.getMockupResponse("/", "default")).toBe("<html>root</html>");
  });

  test("returns HTML response from cache", () => {
    const repo = new MockupRepository(tmpDir);
    const res = repo.getMockupResponse("/wp-admin", "default") as string;
    expect(res).toContain("WP Admin");
  });

  test("returns null for unknown endpoint", () => {
    const repo = new MockupRepository(tmpDir);
    expect(repo.getMockupResponse("/nonexistent", "default")).toBeNull();
  });

  test("returns complete variant response", () => {
    const repo = new MockupRepository(tmpDir);
    const res = repo.getMockupResponse("/server-info", "complete") as any;
    expect(res.server).toBe("Apache");
  });

  test("returns null for variant-missing endpoint", () => {
    const repo = new MockupRepository(tmpDir);
    expect(repo.getMockupResponse("/.env", "complete")).toBeNull();
  });

  test("ensureMockupForEndpoint creates new endpoint in cache and on disk", () => {
    const repo = new MockupRepository(tmpDir);
    repo.ensureMockupForEndpoint("/new-endpoint", "default", { test: true, value: 42 });

    const endpoints = repo.getVariantEndpoints("default");
    expect(endpoints).toContain("/new-endpoint");

    const res = repo.getMockupResponse("/new-endpoint", "default") as any;
    expect(res.test).toBe(true);
    expect(res.value).toBe(42);

    const filePath = path.join(tmpDir, "default", "new-endpoint", "index.mock");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test("ensureMockupForEndpoint creates nested endpoint", () => {
    const repo = new MockupRepository(tmpDir);
    repo.ensureMockupForEndpoint("/a/b/c", "default", { nested: true });

    expect(repo.getVariantEndpoints("default")).toContain("/a/b/c");

    const res = repo.getMockupResponse("/a/b/c", "default") as any;
    expect(res.nested).toBe(true);

    const filePath = path.join(tmpDir, "default", "a", "b", "c", "index.mock");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test("ensureMockupForEndpoint does not overwrite existing", () => {
    const repo = new MockupRepository(tmpDir);
    repo.ensureMockupForEndpoint("/admin", "default", { shouldNotOverwrite: true });

    const res = repo.getMockupResponse("/admin", "default") as any;
    expect(res.status).toBe("ok");
    expect(res.shouldNotOverwrite).toBeUndefined();
  });

  test("handles empty mockups directory", () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "honeypot-empty-"));
    try {
      const repo = new MockupRepository(emptyDir);
      expect(repo.getVariantEndpoints("default")).toEqual([]);
      expect(repo.getVariantEndpoints("complete")).toEqual([]);
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });
});

describe("MockupRepository parseResponse", () => {
  test("parses valid JSON object", () => {
    const repo = new MockupRepository(tmpDir);
    const filePath = path.join(tmpDir, "default", "admin", "index.mock");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(() => JSON.parse(content)).not.toThrow();
  });

  test("treats non-JSON content as string", () => {
    const repo = new MockupRepository(tmpDir);
    const res = repo.getMockupResponse("/wp-admin", "default");
    expect(typeof res).toBe("string");
    expect(res).toContain("<html>");
  });

  test("parses JSON array", () => {
    const singleTestDir = fs.mkdtempSync(path.join(os.tmpdir(), "honeypot-array-"));
    try {
      fs.mkdirSync(path.join(singleTestDir, "default", "items"), { recursive: true });
      fs.writeFileSync(
        path.join(singleTestDir, "default", "items", "index.mock"),
        JSON.stringify([1, 2, 3]),
      );
      const repo = new MockupRepository(singleTestDir);
      const res = repo.getMockupResponse("/items", "default") as number[];
      expect(Array.isArray(res)).toBe(true);
      expect(res).toEqual([1, 2, 3]);
    } finally {
      fs.rmSync(singleTestDir, { recursive: true, force: true });
    }
  });

  test("handles malformed JSON gracefully", () => {
    const singleTestDir = fs.mkdtempSync(path.join(os.tmpdir(), "honeypot-malformed-"));
    try {
      fs.mkdirSync(path.join(singleTestDir, "default", "bad"), { recursive: true });
      fs.writeFileSync(path.join(singleTestDir, "default", "bad", "index.mock"), "{invalid: json}");
      const repo = new MockupRepository(singleTestDir);
      const res = repo.getMockupResponse("/bad", "default");
      expect(typeof res).toBe("string");
      expect(res).toBe("{invalid: json}");
    } finally {
      fs.rmSync(singleTestDir, { recursive: true, force: true });
    }
  });
});
