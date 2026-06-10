/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { PathClassifier } from "../src/services/pathClassifier";

const EMPTY = { knownPaths: [], knownPatterns: [], knownApiPaths: [], knownApiPatterns: [] };

describe("PathClassifier", () => {
  describe("normalizePath", () => {
    test("strips query string", () => {
      expect(PathClassifier.normalizePath("/api/users?page=1")).toBe("/api/users");
    });

    test("removes trailing slash", () => {
      expect(PathClassifier.normalizePath("/api/users/")).toBe("/api/users");
    });

    test("strips HTTP method prefix", () => {
      expect(PathClassifier.normalizePath("GET /login")).toBe("/login");
    });

    test("returns / for empty path", () => {
      expect(PathClassifier.normalizePath("")).toBe("/");
    });

    test("handles combined query + trailing slash", () => {
      expect(PathClassifier.normalizePath("/api/users/?page=1")).toBe("/api/users");
    });

    test("preserves path with no changes needed", () => {
      expect(PathClassifier.normalizePath("/dashboard")).toBe("/dashboard");
    });

    test("handles root path", () => {
      expect(PathClassifier.normalizePath("/")).toBe("/");
    });

    test("handles POST method prefix", () => {
      expect(PathClassifier.normalizePath("POST /api/data")).toBe("/api/data");
    });
  });

  describe("isKnownPath", () => {
    test("returns unknown for empty input", () => {
      const result = PathClassifier.isKnownPath("", EMPTY);
      expect(result.isKnown).toBe(false);
      expect(result.type).toBe("unknown");
    });

    test("returns unknown for nullish input", () => {
      const result = PathClassifier.isKnownPath(null as any, EMPTY);
      expect(result.isKnown).toBe(false);
      expect(result.type).toBe("unknown");
    });

    test("detects known static path", () => {
      const result = PathClassifier.isKnownPath("GET /login", {
        ...EMPTY,
        knownPaths: ["/login"],
      });
      expect(result.isKnown).toBe(true);
      expect(result.type).toBe("page");
    });

    test("detects known API path", () => {
      const result = PathClassifier.isKnownPath("/api/users", {
        ...EMPTY,
        knownApiPaths: ["/api/users"],
      });
      expect(result.isKnown).toBe(true);
      expect(result.type).toBe("api");
    });

    test("detects known pattern", () => {
      const result = PathClassifier.isKnownPath("/products/42", {
        ...EMPTY,
        knownPatterns: [/^\/products\/\d+$/],
      });
      expect(result.isKnown).toBe(true);
      expect(result.type).toBe("page");
    });

    test("detects known API pattern", () => {
      const result = PathClassifier.isKnownPath("/api/v2/users/123", {
        ...EMPTY,
        knownApiPatterns: [/^\/api\/v\d+\//],
      });
      expect(result.isKnown).toBe(true);
      expect(result.type).toBe("api");
    });

    test("returns unknown for non-matching path", () => {
      const result = PathClassifier.isKnownPath("/unknown/path", {
        ...EMPTY,
        knownPaths: ["/login"],
      });
      expect(result.isKnown).toBe(false);
      expect(result.type).toBe("unknown");
    });

    test("classifies /api/ prefixed paths as api type", () => {
      const result = PathClassifier.isKnownPath("/api/data", {
        ...EMPTY,
        knownPaths: ["/api/data"],
      });
      expect(result.isKnown).toBe(true);
      expect(result.type).toBe("api");
    });

    test("normalizes path before checking", () => {
      const result = PathClassifier.isKnownPath("GET /login/ ", {
        ...EMPTY,
        knownPaths: ["/login"],
      });
      expect(result.isKnown).toBe(true);
    });

    test("prioritizes knownApiPaths for type detection", () => {
      const result = PathClassifier.isKnownPath("/custom-api/route", {
        ...EMPTY,
        knownApiPaths: ["/custom-api/route"],
      });
      expect(result.isKnown).toBe(true);
      expect(result.type).toBe("api");
    });
  });
});
