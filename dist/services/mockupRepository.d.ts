export type MockupVariant = "default" | "complete";
export declare class MockupRepository {
    private readonly rootDir;
    constructor(rootDir: string);
    getVariantEndpoints(variant: MockupVariant): string[];
    getMockupResponse(endpoint: string, variant: MockupVariant): unknown | null;
    ensureMockupForEndpoint(endpoint: string, variant: MockupVariant, responseObject: unknown): void;
    private endpointToMockupPath;
    private parseResponse;
}
