import { KnownPathOptions, RouteApp } from "../types";
export declare class TrafficService {
    private readonly projectRoot;
    private readonly trafficFilePath;
    private readonly botsFilePath;
    constructor(projectRoot: string);
    registerLoggingMiddleware(app: RouteApp, knownPathOptions: KnownPathOptions): void;
    getAllBotsRequests(knownPathOptions: KnownPathOptions): string;
    private ensureLogFiles;
}
