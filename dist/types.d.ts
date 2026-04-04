export interface KnownPathOptions {
    knownPaths: string[];
    knownPatterns: RegExp[];
    knownApiPaths: string[];
    knownApiPatterns: RegExp[];
}
export interface HoneypotOptions extends KnownPathOptions {
    is404Handler?: boolean;
    logTraffic?: boolean;
    isCompleteResponses?: boolean;
}
export interface RouteApp {
    use: (handler: (...args: any[]) => void) => void;
    all: (path: string, handler: (...args: any[]) => void) => void;
    get: (path: string, handler: (...args: any[]) => void) => void;
}
