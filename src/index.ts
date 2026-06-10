import { MockupRepository, MockupVariant } from "./services/mockupRepository";
import { PathClassifier } from "./services/pathClassifier";
import { TrafficService } from "./services/trafficService";
import { UnhandledRoutesService } from "./services/unhandledRoutesService";
import { HoneypotOptions, HoneypotInstance, RouteApp, KnownPathOptions, Middleware } from "./types";

const DEFAULT_ADDITIONAL_ENDPOINTS = ["/not_covered_endpoint_test"];

function getTimestamp(): string {
  return new Date().toISOString();
}

function enrichResponse(response: Record<string, unknown>): Record<string, unknown> {
  return {
    ...response,
    timestamp: getTimestamp(),
    version: "1.0",
    lastUpdated: getTimestamp(),
  };
}

function isRouteApp(obj: unknown): obj is RouteApp {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof (obj as RouteApp).use === "function" &&
    typeof (obj as RouteApp).all === "function"
  );
}

export function createHoneypot(
  appOrOptions: RouteApp | HoneypotOptions,
  options?: HoneypotOptions,
): HoneypotInstance {
  if (isRouteApp(appOrOptions)) {
    const instance = createHoneypot(options!);
    instance.register(appOrOptions);
    return instance;
  }

  const opts = appOrOptions as HoneypotOptions;
  const {
    logTraffic,
    knownPaths = [],
    knownApiPaths = [],
    knownPatterns = [],
    knownApiPatterns = [],
    isCompleteResponses = false,
    is404Handler,
    additionalEndpoints = DEFAULT_ADDITIONAL_ENDPOINTS,
    enrichResponses: shouldEnrich = true,
  } = opts;

  const knownPathOptions: KnownPathOptions = { knownPaths, knownPatterns, knownApiPaths, knownApiPatterns };

  const mockupRepository = new MockupRepository();
  const trafficService = new TrafficService(process.cwd());
  const unhandledRoutesService = new UnhandledRoutesService(trafficService, () =>
    mockupRepository.getVariantEndpoints("default"),
  );

  const notCoveredAdditionalEndpoints = additionalEndpoints.filter(
    (ep) => !mockupRepository.getVariantEndpoints("default").includes(ep),
  );

  const variant: MockupVariant = isCompleteResponses ? "complete" : "default";

  for (const endpoint of notCoveredAdditionalEndpoints) {
    mockupRepository.ensureMockupForEndpoint(endpoint, variant, {
      status: "Endpoint active",
      description: `This endpoint is active and serves requests for ${endpoint}.`,
    });
  }

  const allEndpoints = mockupRepository.getVariantEndpoints(variant);

  const mocks: Record<string, Middleware> = {};

  for (const endpoint of allEndpoints) {
    if (PathClassifier.isKnownPath(endpoint, knownPathOptions).isKnown) continue;

    const matches = endpoint === "/"
      ? (p: string) => p === "/"
      : (p: string) => p === endpoint || p.startsWith(endpoint + "/");

    mocks[endpoint] = (req: any, res: any, next: any) => {
      if (!matches(req.path)) return next?.();

      const response = mockupRepository.getMockupResponse(endpoint, variant);
      if (response === null || response === undefined) {
        res.status(500).send("Invalid response format");
        return;
      }

      // Attempt to parse as JSON for enrichment, fall back to raw string
      if (shouldEnrich) {
        try {
          const parsed = JSON.parse(response);
          if (parsed && typeof parsed === "object") {
            res.json(enrichResponse(parsed));
            return;
          }
        } catch { /* not JSON — send as-is */ }
      }

      res.send(response);
    };
  }

  const phpSpoofer: Middleware = async (req: any, res: any, next: any) => {
    if (!req.path?.match(/\.php$/)) {
      return next?.();
    }

    try {
      const host = req.headers?.host;
      if (!host || typeof host !== "string") {
        return next?.();
      }

      if (
        !host.startsWith("localhost") &&
        !host.startsWith("127.0.0.1") &&
        !host.startsWith("[::1]")
      ) {
        res.status(404).send("<html><body><h1>404 Not Found</h1></body></html>");
        return;
      }

      const baseUrl = (req.originalUrl || req.url).replace(/\.php.*$/, "");
      const response = await fetch(`http://${host}${baseUrl}`);

      if (!response.ok) {
        res.status(404).send("<html><body><h1>404 Not Found</h1></body></html>");
        return;
      }

      const html = await response.text();
      res.send(html);
    } catch {
      res.status(500).send("<html><body><h1>Internal Server Error</h1></body></html>");
    }
  };

  const notFoundHandler: Middleware = (_req: any, res: any) => {
    res.status(404).send(
      "<html><body><h1>404 Not Found</h1><p>The requested resource was not found on this server.</p></body></html>",
    );
  };

  const middleware: Middleware = (req: any, res: any, next: any) => {
    const path = req.path || "";
    if (PathClassifier.isKnownPath(path, knownPathOptions).isKnown) return next?.();

    const response = mockupRepository.getMockupResponse(path, variant);
    if (response === null || response === undefined) return next?.();

    if (shouldEnrich) {
      try {
        const parsed = JSON.parse(response);
        if (parsed && typeof parsed === "object") {
          res.json(enrichResponse(parsed));
          return;
        }
      } catch { /* not JSON — send as-is */ }
    }

    res.send(response);
  };

  const instance: HoneypotInstance = {
    mocks,
    middleware,
    phpSpoofer,
    notFoundHandler,

    register(app: RouteApp) {
      if (logTraffic) {
        app.use(trafficService.createLoggingMiddleware());
      }

      for (const [endpoint, handler] of Object.entries(mocks)) {
        app.all(endpoint, handler);
      }

      app.get(/\.php$/, phpSpoofer);

      app.get("/newBotsRoute", async (_req: any, res: any) => {
        const routes = await unhandledRoutesService.getUnhandledRoutes(additionalEndpoints, knownPathOptions);
        res.setHeader("Content-Type", "text/plain");
        res.send(routes.join("\n"));
      });

      app.get("/notCoveredAdditionalEndpoints", (_req: any, res: any) => {
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(notCoveredAdditionalEndpoints));
      });

      if (is404Handler) {
        app.use(notFoundHandler);
      }
    },

    async getUnhandledRoutes() {
      return unhandledRoutesService.getUnhandledRoutes(additionalEndpoints, knownPathOptions);
    },

    getNotCoveredEndpoints() {
      return [...notCoveredAdditionalEndpoints];
    },
  };

  return instance;
}

export default createHoneypot;
