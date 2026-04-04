import fs from "fs";
import path from "path";

export type MockupVariant = "default" | "complete";

export class MockupRepository {
  constructor(private readonly rootDir: string) {}

  getVariantEndpoints(variant: MockupVariant): string[] {
    const variantRoot = path.join(this.rootDir, variant);
    if (!fs.existsSync(variantRoot)) return [];

    const endpoints: string[] = [];

    const walk = (currentPath: string) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      entries.forEach((entry: fs.Dirent) => {
        const entryPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          walk(entryPath);
          return;
        }

        if (entry.name !== "index.mock") return;

        const relativePath = path.relative(variantRoot, entryPath).split(path.sep).join("/");
        const endpoint = relativePath === "index.mock" ? "/" : `/${relativePath.replace(/\/index\.mock$/, "")}`;
        endpoints.push(endpoint);
      });
    };

    walk(variantRoot);
    return endpoints;
  }

  getMockupResponse(endpoint: string, variant: MockupVariant): unknown | null {
    const filePath = this.endpointToMockupPath(endpoint, variant);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    return this.parseResponse(content);
  }

  ensureMockupForEndpoint(endpoint: string, variant: MockupVariant, responseObject: unknown): void {
    const filePath = this.endpointToMockupPath(endpoint, variant);
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(responseObject, null, 2), "utf-8");
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
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        return JSON.parse(trimmed);
      } catch (_error) {
        return fileContent;
      }
    }

    return fileContent;
  }
}
