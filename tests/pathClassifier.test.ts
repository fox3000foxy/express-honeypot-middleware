/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { PathClassifier } from "../src/services/pathClassifier";

describe("PathClassifier", () => {
  test("normalizes trailing slash and query string", () => {
    expect(PathClassifier.normalizePath("/api/users/?page=1")).toBe("/api/users");
  });

  test("detects known static path", () => {
    const result = PathClassifier.isKnownPath("GET /login", {
      knownPaths: ["/login"],
      knownPatterns: [],
      knownApiPaths: [],
      knownApiPatterns: [],
    });

    expect(result.isKnown).toBe(true);
    expect(result.type).toBe("page");
  });
});
