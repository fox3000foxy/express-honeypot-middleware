import { KnownPathOptions } from "../types";

export interface KnownPathResult {
  isKnown: boolean;
  type: "api" | "page" | "unknown";
}

export class PathClassifier {
  static normalizePath(inputPath: string): string {
    const noQuery = inputPath.split("?")[0];
    const withoutMethod = noQuery.replace(/^(GET|POST|DELETE|PUT|PATCH|HEAD)\s+/, "");
    const normalized = withoutMethod.trim().replace(/\/$/, "");
    return normalized || "/";
  }

  static isKnownPath(inputPath: string, options: KnownPathOptions): KnownPathResult {
    if (!inputPath) {
      return { isKnown: false, type: "unknown" };
    }

    const normalizedPath = this.normalizePath(inputPath);
    const isKnown =
      options.knownPaths.includes(normalizedPath) ||
      options.knownPatterns.some((pattern) => pattern.test(normalizedPath)) ||
      options.knownApiPaths.includes(normalizedPath) ||
      options.knownApiPatterns.some((pattern) => pattern.test(normalizedPath));

    return {
      isKnown,
      type: isKnown
        ? normalizedPath.startsWith("/api/") || options.knownApiPaths.includes(normalizedPath)
          ? "api"
          : "page"
        : "unknown",
    };
  }
}
