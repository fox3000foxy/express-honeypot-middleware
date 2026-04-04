"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockupRepository = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class MockupRepository {
    constructor(rootDir) {
        this.rootDir = rootDir;
    }
    getVariantEndpoints(variant) {
        const variantRoot = path_1.default.join(this.rootDir, variant);
        if (!fs_1.default.existsSync(variantRoot))
            return [];
        const endpoints = [];
        const walk = (currentPath) => {
            const entries = fs_1.default.readdirSync(currentPath, { withFileTypes: true });
            entries.forEach((entry) => {
                const entryPath = path_1.default.join(currentPath, entry.name);
                if (entry.isDirectory()) {
                    walk(entryPath);
                    return;
                }
                if (entry.name !== "index.mock")
                    return;
                const relativePath = path_1.default.relative(variantRoot, entryPath).split(path_1.default.sep).join("/");
                const endpoint = relativePath === "index.mock" ? "/" : `/${relativePath.replace(/\/index\.mock$/, "")}`;
                endpoints.push(endpoint);
            });
        };
        walk(variantRoot);
        return endpoints;
    }
    getMockupResponse(endpoint, variant) {
        const filePath = this.endpointToMockupPath(endpoint, variant);
        if (!fs_1.default.existsSync(filePath))
            return null;
        const content = fs_1.default.readFileSync(filePath, "utf-8");
        return this.parseResponse(content);
    }
    ensureMockupForEndpoint(endpoint, variant, responseObject) {
        const filePath = this.endpointToMockupPath(endpoint, variant);
        const dirPath = path_1.default.dirname(filePath);
        if (!fs_1.default.existsSync(dirPath)) {
            fs_1.default.mkdirSync(dirPath, { recursive: true });
        }
        if (!fs_1.default.existsSync(filePath)) {
            fs_1.default.writeFileSync(filePath, JSON.stringify(responseObject, null, 2), "utf-8");
        }
    }
    endpointToMockupPath(endpoint, variant) {
        const cleanEndpoint = endpoint.split("?")[0];
        const segments = cleanEndpoint.split("/").filter(Boolean);
        if (segments.length === 0) {
            return path_1.default.join(this.rootDir, variant, "index.mock");
        }
        return path_1.default.join(this.rootDir, variant, ...segments, "index.mock");
    }
    parseResponse(fileContent) {
        const trimmed = fileContent.trim();
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
            try {
                return JSON.parse(trimmed);
            }
            catch (_error) {
                return fileContent;
            }
        }
        return fileContent;
    }
}
exports.MockupRepository = MockupRepository;
