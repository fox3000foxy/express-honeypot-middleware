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
  additionalEndpoints?: string[];
  enrichResponses?: boolean;
}

export interface RouteApp {
  use: (pathOrHandler: any, ...handlers: any[]) => void;
  all: (path: string, ...handlers: any[]) => void;
  get: (path: string | RegExp, ...handlers: any[]) => void;
}

export type Middleware = (...args: any[]) => void | Promise<void>;

export interface HoneypotInstance {
  mocks: Record<string, Middleware>;
  phpSpoofer: Middleware;
  notFoundHandler: Middleware;
  register: (app: RouteApp) => void;
  getUnhandledRoutes: () => Promise<string[]>;
  getNotCoveredEndpoints: () => string[];
}
