import fetch from "node-fetch";
import path from "path";
import { MockupRepository } from "./services/mockupRepository";
import { PathClassifier } from "./services/pathClassifier";
import { TrafficService } from "./services/trafficService";
import { UnhandledRoutesService } from "./services/unhandledRoutesService";
import { HoneypotOptions, RouteApp } from "./types";

const additionalEndpoints = [
  "/not_covered_endpoint_test",
];

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

function buildRuntimeJsonResponse(response: Record<string, unknown>): Record<string, unknown> {
  return {
    ...response,
    timestamp: getCurrentTimestamp(),
    version: "1.0",
    lastUpdated: "2023-10-01",
  };
}

module.exports = (app: RouteApp, options: HoneypotOptions): void => {
  const {
    is404Handler,
    logTraffic,
    knownPaths,
    knownApiPaths,
    knownPatterns,
    knownApiPatterns,
    isCompleteResponses = false,
  } = options;

  const knownPathOptions = {
    knownPaths,
    knownPatterns,
    knownApiPaths,
    knownApiPatterns,
  };

  const projectRoot = __dirname === "." ? process.cwd() : path.resolve(__dirname, "..");
  const mockupRepository = new MockupRepository(path.join(projectRoot, "mockups"));
  const trafficService = new TrafficService(projectRoot);
  const unhandledRoutesService = new UnhandledRoutesService(trafficService, () => mockupRepository.getVariantEndpoints("default"));

  if (logTraffic) {
    trafficService.registerLoggingMiddleware(app, knownPathOptions);
  }

  const notCoveredAdditionalEndpoints = additionalEndpoints.filter(
    (endpoint) => !mockupRepository.getVariantEndpoints("default").includes(endpoint),
  );

  notCoveredAdditionalEndpoints.forEach((endpoint) => {
    mockupRepository.ensureMockupForEndpoint(endpoint, "default", {
      status: "Endpoint active",
      description: `This endpoint is active and serves requests for ${endpoint}.`,
    });
  });

  const variant = isCompleteResponses ? "complete" : "default";
  const endpoints = mockupRepository.getVariantEndpoints(variant);

  endpoints.forEach((endpoint) => {
    const isKnown = PathClassifier.isKnownPath(endpoint, knownPathOptions).isKnown;
    if (isKnown) return;

    app.all(endpoint, async (_req: any, res: any) => {
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
        res.json(buildRuntimeJsonResponse(response as Record<string, unknown>));
        return;
      }

      res.status(500).send("Invalid response format");
    });
  });

  app.get("/newBotsRoute", (_req: any, res: any) => {
    const unhandledRoutes = unhandledRoutesService.getUnhandledRoutes(additionalEndpoints, knownPathOptions);
    res.setHeader("Content-Type", "text/plain");
    res.send(unhandledRoutes.join("\n"));
  });

  app.get("/notCoveredAdditionalEndpoints", (_req: any, res: any) => {
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(notCoveredAdditionalEndpoints));
  });

  app.get("*.php", async (req: any, res: any) => {
    const host = req.headers.host;
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const response = await fetch(`${protocol}://${host}${req.originalUrl.split(".php")[0]}`);
    const html = await response.text();
    res.send(html);
  });

  if (is404Handler) {
    app.use((_req: any, res: any) => {
      res.status(404).send("<html><body><h1>404 Not Found</h1><p>The requested resource was not found on this server.</p></body></html>");
    });
  }
};
