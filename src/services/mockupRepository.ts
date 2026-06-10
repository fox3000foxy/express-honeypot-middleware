import { generateMockup, ALL_ENDPOINTS } from "./mockupGenerator";
import type { Variant } from "./mockupGenerator";

export type MockupVariant = Variant;

interface AdditionalCache {
  responses: Map<string, string>;
}

export class MockupRepository {
  private additionalCache: AdditionalCache = { responses: new Map() };

  getVariantEndpoints(_variant: MockupVariant): string[] {
    return ALL_ENDPOINTS;
  }

  getMockupResponse(endpoint: string, variant: MockupVariant): string | null {
    // Additional endpoints take priority
    const key = `${variant}:${endpoint}`;
    if (this.additionalCache.responses.has(key)) {
      return this.additionalCache.responses.get(key)!;
    }
    // Generate on-the-fly — fresh timestamps per request
    return generateMockup(variant, endpoint);
  }

  ensureMockupForEndpoint(endpoint: string, variant: MockupVariant, responseObject: unknown): void {
    const key = `${variant}:${endpoint}`;
    if (!this.additionalCache.responses.has(key)) {
      const content = typeof responseObject === "string" ? responseObject : JSON.stringify(responseObject, null, 2);
      this.additionalCache.responses.set(key, content);
    }
  }
}
