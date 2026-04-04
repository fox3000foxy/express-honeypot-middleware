import { KnownPathOptions } from "../types";
import { PathClassifier } from "./pathClassifier";
import { TrafficService } from "./trafficService";

export class UnhandledRoutesService {
  constructor(
    private readonly trafficService: TrafficService,
    private readonly listAvailableEndpoints: () => string[],
  ) {}

  getUnhandledRoutes(additionalEndpoints: string[], knownPathOptions: KnownPathOptions): string[] {
    const availableEndpoints = this.listAvailableEndpoints();
    const botsRequests = this.trafficService.getAllBotsRequests(knownPathOptions);
    const unhandledRoutes: string[] = [];

    botsRequests.split("\n").forEach((botRequest) => {
      const requestPath = botRequest
        .split(" - ")[2]
        ?.replace(/^(GET|POST|DELETE|PUT|PATCH|HEAD) /, "")
        .trim();

      if (!requestPath) return;

      const isKnown = PathClassifier.isKnownPath(requestPath, knownPathOptions).isKnown;
      const isAdditionalEndpoint = additionalEndpoints.includes(requestPath);
      const normalizedPath = PathClassifier.normalizePath(requestPath);
      const isResponseKey = availableEndpoints.some((endpoint) => PathClassifier.normalizePath(endpoint) === normalizedPath);

      if (!isKnown && !isAdditionalEndpoint && !isResponseKey) {
        unhandledRoutes.push(requestPath);
      }
    });

    return [...new Set(unhandledRoutes)];
  }
}
