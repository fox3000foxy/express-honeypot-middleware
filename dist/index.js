"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const path_1 = __importDefault(require("path"));
const mockupRepository_1 = require("./services/mockupRepository");
const pathClassifier_1 = require("./services/pathClassifier");
const trafficService_1 = require("./services/trafficService");
const unhandledRoutesService_1 = require("./services/unhandledRoutesService");
const additionalEndpoints = [
    "/not_covered_endpoint_test",
];
function getCurrentTimestamp() {
    return new Date().toISOString();
}
function buildRuntimeJsonResponse(response) {
    return {
        ...response,
        timestamp: getCurrentTimestamp(),
        version: "1.0",
        lastUpdated: "2023-10-01",
    };
}
module.exports = (app, options) => {
    const { is404Handler, logTraffic, knownPaths, knownApiPaths, knownPatterns, knownApiPatterns, isCompleteResponses = false, } = options;
    const knownPathOptions = {
        knownPaths,
        knownPatterns,
        knownApiPaths,
        knownApiPatterns,
    };
    const projectRoot = __dirname === "." ? process.cwd() : path_1.default.resolve(__dirname, "..");
    const mockupRepository = new mockupRepository_1.MockupRepository(path_1.default.join(projectRoot, "mockups"));
    const trafficService = new trafficService_1.TrafficService(projectRoot);
    const unhandledRoutesService = new unhandledRoutesService_1.UnhandledRoutesService(trafficService, () => mockupRepository.getVariantEndpoints("default"));
    if (logTraffic) {
        trafficService.registerLoggingMiddleware(app, knownPathOptions);
    }
    const notCoveredAdditionalEndpoints = additionalEndpoints.filter((endpoint) => !mockupRepository.getVariantEndpoints("default").includes(endpoint));
    notCoveredAdditionalEndpoints.forEach((endpoint) => {
        mockupRepository.ensureMockupForEndpoint(endpoint, "default", {
            status: "Endpoint active",
            description: `This endpoint is active and serves requests for ${endpoint}.`,
        });
    });
    const variant = isCompleteResponses ? "complete" : "default";
    const endpoints = mockupRepository.getVariantEndpoints(variant);
    endpoints.forEach((endpoint) => {
        const isKnown = pathClassifier_1.PathClassifier.isKnownPath(endpoint, knownPathOptions).isKnown;
        if (isKnown)
            return;
        app.all(endpoint, async (_req, res) => {
            const response = mockupRepository.getMockupResponse(endpoint, variant);
            if (response === null) {
                res.status(500).send("Invalid response format");
                return;
            }
            if (typeof response === "string") {
                res.send(response);
                return;
            }
            if (typeof response === "object") {
                res.json(buildRuntimeJsonResponse(response));
                return;
            }
            res.status(500).send("Invalid response format");
        });
    });
    app.get("/newBotsRoute", (_req, res) => {
        const unhandledRoutes = unhandledRoutesService.getUnhandledRoutes(additionalEndpoints, knownPathOptions);
        res.setHeader("Content-Type", "text/plain");
        res.send(unhandledRoutes.join("\n"));
    });
    app.get("/notCoveredAdditionalEndpoints", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(notCoveredAdditionalEndpoints));
    });
    app.get("*.php", async (req, res) => {
        const host = req.headers.host;
        const protocol = host.startsWith("localhost") ? "http" : "https";
        const response = await (0, node_fetch_1.default)(`${protocol}://${host}${req.originalUrl.split(".php")[0]}`);
        const html = await response.text();
        res.send(html);
    });
    if (is404Handler) {
        app.use((_req, res) => {
            res.status(404).send("<html><body><h1>404 Not Found</h1><p>The requested resource was not found on this server.</p></body></html>");
        });
    }
};
