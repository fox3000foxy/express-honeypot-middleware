import fs from "fs";
import path from "path";

export type MockupVariant = "default" | "complete";

interface VariantCache {
  endpoints: string[];
  responses: Map<string, unknown>;
}

export class MockupRepository {
  private cache: Map<MockupVariant, VariantCache> = new Map();

  constructor(private readonly rootDir: string) {
    this.preloadVariant("default");
    this.preloadVariant("complete");
  }

  private preloadVariant(variant: MockupVariant): void {
    const variantPath = path.join(this.rootDir, variant);
    const cache: VariantCache = { endpoints: [], responses: new Map() };

    if (!fs.existsSync(variantPath)) {
      this.cache.set(variant, cache);
      return;
    }

    const walk = (currentPath: string) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          walk(entryPath);
          continue;
        }
        if (entry.name !== "index.mock") continue;

        const relativePath = path.relative(variantPath, entryPath).split(path.sep).join("/");
        const endpoint = relativePath === "index.mock" ? "/" : `/${relativePath.replace(/\/index\.mock$/, "")}`;

        const content = fs.readFileSync(entryPath, "utf-8");
        const response = this.parseResponse(content);

        cache.endpoints.push(endpoint);
        cache.responses.set(endpoint, response);
      }
    };

    walk(variantPath);
    this.cache.set(variant, cache);
  }

  getVariantEndpoints(variant: MockupVariant): string[] {
    return this.cache.get(variant)?.endpoints ?? [];
  }

  getMockupResponse(endpoint: string, variant: MockupVariant): unknown | null {
    return this.cache.get(variant)?.responses.get(endpoint) ?? null;
  }

  ensureMockupForEndpoint(endpoint: string, variant: MockupVariant, responseObject: unknown): void {
    const filePath = this.endpointToMockupPath(endpoint, variant);
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      const content = JSON.stringify(responseObject, null, 2);
      fs.writeFileSync(filePath, content, "utf-8");

      const cache = this.cache.get(variant);
      if (cache) {
        cache.endpoints.push(endpoint);
        cache.responses.set(endpoint, this.parseResponse(content));
      }
    }
  }

  private endpointToMockupPath(endpoint: string, variant: MockupVariant): string {
    const cleanEndpoint = endpoint.split("?")[0];
    const segments = cleanEndpoint.split("/").filter(Boolean);

    if (segments.length === 0) {
      return path.join(this.rootDir, variant, "index.mock");
    }

    return path.join(this.rootDir, variant, ...segments, "index.mock");
  }

  private parseResponse(fileContent: string): unknown {
    const trimmed = fileContent.trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      return fileContent;
    }
  }
}
