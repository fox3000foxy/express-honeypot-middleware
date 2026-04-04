import { KnownPathOptions } from "../types";
import { TrafficService } from "./trafficService";
export declare class UnhandledRoutesService {
    private readonly trafficService;
    private readonly listAvailableEndpoints;
    constructor(trafficService: TrafficService, listAvailableEndpoints: () => string[]);
    getUnhandledRoutes(additionalEndpoints: string[], knownPathOptions: KnownPathOptions): string[];
}
