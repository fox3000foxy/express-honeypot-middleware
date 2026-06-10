import { MockupRepository, MockupVariant } from "./services/mockupRepository";
import { PathClassifier } from "./services/pathClassifier";
import { TrafficService } from "./services/trafficService";
import { UnhandledRoutesService } from "./services/unhandledRoutesService";
import { HoneypotOptions, HoneypotInstance, RouteApp, KnownPathOptions, Middleware } from "./types";

const DEFAULT_ADDITIONAL_ENDPOINTS = ["/not_covered_endpoint_test"];

function getTimestamp(): string {
  return new Date().toISOString();
}

function randomDelay(): number {
  return Math.floor(Math.random() * 250) + 50; // 50-300ms
}

const NGINX_VERSIONS = ["1.24.0", "1.26.0", "1.26.2", "1.27.0"];

function getNginxVersion(): string {
  return NGINX_VERSIONS[Math.floor(Math.random() * NGINX_VERSIONS.length)];
}

function detectContentType(response: string): string {
  const trimmed = response.trimStart();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.startsWith("<string")) return "text/html; charset=utf-8";
  if (trimmed.startsWith("<?xml")) return "application/xml; charset=utf-8";
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "application/json; charset=utf-8";
  if (trimmed.startsWith("#") || trimmed.startsWith("SET ") || trimmed.startsWith("CREATE ") || trimmed.startsWith("--")) return "text/plain; charset=utf-8";
  if (trimmed.startsWith("-----BEGIN")) return "application/x-pem-file";
  if (trimmed.startsWith("[") && trimmed.includes("]")) return "text/plain; charset=utf-8"; // .env style
  if (trimmed.startsWith("worker_processes") || trimmed.startsWith("server {") || trimmed.startsWith("ServerRoot") || trimmed.startsWith("RewriteEngine") || trimmed.startsWith("pipeline {")) return "text/plain; charset=utf-8";
  if (trimmed.startsWith("apiVersion:") || trimmed.startsWith("version:")) return "text/plain; charset=utf-8"; // YAML
  if (trimmed.startsWith("name:")) return "text/plain; charset=utf-8"; // YAML/GHA
  if (trimmed.startsWith("image:")) return "text/plain; charset=utf-8"; // YAML
  if (trimmed.startsWith("PK\u0003")) return "application/octet-stream";
  return "text/html; charset=utf-8";
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

      setTimeout(() => {
        res.setHeader("Content-Type", detectContentType(response));

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
      }, randomDelay());
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

  const headersMiddleware: Middleware = (req: any, res: any, next: any) => {
    res.setHeader("Server", `nginx/${getNginxVersion()}`);
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("X-RateLimit-Limit", "100");
    res.setHeader("X-RateLimit-Remaining", String(Math.floor(Math.random() * 95) + 5));
    res.setHeader("X-RateLimit-Reset", String(Math.floor(Date.now() / 1000) + 3600));

    // Realistic X-Powered-By based on file extension
    const path = req.path || "";
    if (path.endsWith(".php")) res.setHeader("X-Powered-By", "PHP/8.1.12");
    else if (path.endsWith(".jsp")) res.setHeader("X-Powered-By", "JSP/3.0");
    else if (path.endsWith(".aspx") || path.endsWith(".ashx") || path.endsWith(".asmx")) res.setHeader("X-Powered-By", "ASP.NET");
    else if (path.endsWith(".do") || path.endsWith(".action")) res.setHeader("X-Powered-By", "Servlet/3.0");

    next();
  };

  const middleware: Middleware = (req: any, res: any, next: any) => {
    const path = req.path || "";
    if (PathClassifier.isKnownPath(path, knownPathOptions).isKnown) return next?.();

    const response = mockupRepository.getMockupResponse(path, variant);
    if (response === null || response === undefined) return next?.();

    setTimeout(() => {
      res.setHeader("Content-Type", detectContentType(response));

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
    }, randomDelay());
  };

  const instance: HoneypotInstance = {
    mocks,
    middleware,
    headersMiddleware,
    phpSpoofer,
    notFoundHandler,

    register(app: RouteApp) {
      if (logTraffic) {
        app.use(trafficService.createLoggingMiddleware());
      }

      app.use(headersMiddleware);

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
