import { KnownPathOptions } from "../types";
import { PathClassifier } from "./pathClassifier";
import { TrafficService } from "./trafficService";

export class UnhandledRoutesService {
  constructor(
    private readonly trafficService: TrafficService,
    private readonly listAvailableEndpoints: () => string[],
  ) {}

  async getUnhandledRoutes(additionalEndpoints: string[], knownPathOptions: KnownPathOptions): Promise<string[]> {
    const availableEndpoints = this.listAvailableEndpoints();
    const botEntries = await this.trafficService.getBotRequests(knownPathOptions);
    const unhandledRoutes = new Set<string>();

    for (const entry of botEntries) {
      const requestPath = entry.path;
      if (!requestPath) continue;

      const isKnown = PathClassifier.isKnownPath(requestPath, knownPathOptions).isKnown;
      const isAdditionalEndpoint = additionalEndpoints.includes(requestPath);
      const normalizedPath = PathClassifier.normalizePath(requestPath);
      const hasMockup = availableEndpoints.some(
        (endpoint) => PathClassifier.normalizePath(endpoint) === normalizedPath,
      );

      if (!isKnown && !isAdditionalEndpoint && !hasMockup) {
        unhandledRoutes.add(requestPath);
      }
    }

    return [...unhandledRoutes];
  }
}
