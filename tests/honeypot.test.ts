/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { createHoneypot } from "../src/index";
import type { RouteApp } from "../src/types";

function createMockApp(): RouteApp & { calls: string[] } {
  const calls: string[] = [];
  const handlers: Record<string, any> = {};

  return {
    calls,
    use: (...args: any[]) => {
      calls.push(`use(${args.map((a: any) => (typeof a === "function" ? "fn" : JSON.stringify(a))).join(", ")})`);
    },
    all: (path: string, ...args: any[]) => {
      calls.push(`all(${path})`);
      handlers[`all:${path}`] = args;
    },
    get: (path: string | RegExp, ...args: any[]) => {
      calls.push(`get(${path})`);
      handlers[`get:${path}`] = args;
    },
  };
}

describe("createHoneypot", () => {
  test("returns HoneypotInstance with expected keys", () => {
    const instance = createHoneypot({
      knownPaths: [],
      knownPatterns: [],
      knownApiPaths: [],
      knownApiPatterns: [],
    });

    expect(instance).toHaveProperty("mocks");
    expect(instance).toHaveProperty("phpSpoofer");
    expect(instance).toHaveProperty("notFoundHandler");
    expect(instance).toHaveProperty("register");
    expect(instance).toHaveProperty("getUnhandledRoutes");
    expect(instance).toHaveProperty("getNotCoveredEndpoints");
    expect(typeof instance.register).toBe("function");
    expect(typeof instance.getUnhandledRoutes).toBe("function");
    expect(typeof instance.getNotCoveredEndpoints).toBe("function");
    expect(instance.getNotCoveredEndpoints()).toEqual(["/not_covered_endpoint_test"]);
  });

  test("mocks is an object with middleware functions", () => {
    const instance = createHoneypot({
      knownPaths: [],
      knownPatterns: [],
      knownApiPaths: [],
      knownApiPatterns: [],
    });

    expect(typeof instance.mocks).toBe("object");
    for (const key of Object.keys(instance.mocks)) {
      expect(typeof instance.mocks[key]).toBe("function");
      expect(instance.mocks[key].length).toBe(3); // (req, res, next)
    }
  });

  test("phpSpoofer is a middleware function", () => {
    const instance = createHoneypot({
      knownPaths: [],
      knownPatterns: [],
      knownApiPaths: [],
      knownApiPatterns: [],
    });

    expect(typeof instance.phpSpoofer).toBe("function");
    expect(instance.phpSpoofer.length).toBe(3);
  });

  test("notFoundHandler is a middleware function", () => {
    const instance = createHoneypot({
      knownPaths: [],
      knownPatterns: [],
      knownApiPaths: [],
      knownApiPatterns: [],
    });

    expect(typeof instance.notFoundHandler).toBe("function");
    expect(instance.notFoundHandler.length).toBe(2); // (req, res)
  });

  test("register registers handlers on the app", () => {
    const instance = createHoneypot({
      knownPaths: [],
      knownPatterns: [],
      knownApiPaths: [],
      knownApiPatterns: [],
      is404Handler: true,
    });

    const app = createMockApp();
    instance.register(app);

    expect(app.calls.length).toBeGreaterThan(3);
    const allCalls = app.calls.join("\n");
    expect(allCalls).toContain("all(");
    expect(allCalls).toContain("get(");
    expect(allCalls).toContain("use(");
  });

  test("backward compat: (app, options) signature", () => {
    const app = createMockApp();
    const instance = createHoneypot(app, {
      knownPaths: [],
      knownPatterns: [],
      knownApiPaths: [],
      knownApiPatterns: [],
    });

    expect(instance).toHaveProperty("mocks");
    expect(app.calls.length).toBeGreaterThan(0);
  });

  test("accepts custom additionalEndpoints", () => {
    const instance = createHoneypot({
      knownPaths: [],
      knownPatterns: [],
      knownApiPaths: [],
      knownApiPatterns: [],
      additionalEndpoints: ["/custom-test"],
    });

    expect(instance.getNotCoveredEndpoints()).toContain("/custom-test");
  });
});
