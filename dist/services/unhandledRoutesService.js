"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnhandledRoutesService = void 0;
const pathClassifier_1 = require("./pathClassifier");
class UnhandledRoutesService {
    constructor(trafficService, listAvailableEndpoints) {
        this.trafficService = trafficService;
        this.listAvailableEndpoints = listAvailableEndpoints;
    }
    getUnhandledRoutes(additionalEndpoints, knownPathOptions) {
        const availableEndpoints = this.listAvailableEndpoints();
        const botsRequests = this.trafficService.getAllBotsRequests(knownPathOptions);
        const unhandledRoutes = [];
        botsRequests.split("\n").forEach((botRequest) => {
            var _a;
            const requestPath = (_a = botRequest
                .split(" - ")[2]) === null || _a === void 0 ? void 0 : _a.replace(/^(GET|POST|DELETE|PUT|PATCH|HEAD) /, "").trim();
            if (!requestPath)
                return;
            const isKnown = pathClassifier_1.PathClassifier.isKnownPath(requestPath, knownPathOptions).isKnown;
            const isAdditionalEndpoint = additionalEndpoints.includes(requestPath);
            const normalizedPath = pathClassifier_1.PathClassifier.normalizePath(requestPath);
            const isResponseKey = availableEndpoints.some((endpoint) => pathClassifier_1.PathClassifier.normalizePath(endpoint) === normalizedPath);
            if (!isKnown && !isAdditionalEndpoint && !isResponseKey) {
                unhandledRoutes.push(requestPath);
            }
        });
        return [...new Set(unhandledRoutes)];
    }
}
exports.UnhandledRoutesService = UnhandledRoutesService;
