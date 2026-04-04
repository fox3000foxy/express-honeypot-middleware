import fs from "fs";
import path from "path";
import { KnownPathOptions, RouteApp } from "../types";
import { PathClassifier } from "./pathClassifier";

export class TrafficService {
  private readonly trafficFilePath: string;
  private readonly botsFilePath: string;

  constructor(private readonly projectRoot: string) {
    this.trafficFilePath = path.join(projectRoot, "traffic.txt");
    this.botsFilePath = path.join(projectRoot, "bots.txt");
    this.ensureLogFiles();
  }

  registerLoggingMiddleware(app: RouteApp, knownPathOptions: KnownPathOptions): void {
    app.use((req: any, _res: any, next: () => void) => {
      fs.writeFileSync(this.botsFilePath, this.getAllBotsRequests(knownPathOptions));

      if (
        !req.originalUrl.match(/\.(js|css|ico|png|jpg|jpeg|gif|svg|webp)$/) &&
        req.originalUrl !== "/support" &&
        req.headers["user-agent"] !== "local-honeypot-tester"
      ) {
        const logLine = `${new Date().toISOString()} - ${req.headers["x-forwarded-for"] || req.ip} - ${req.headers["user-agent"]} - ${req.method} ${req.originalUrl} - 200 - \"guest\"`;
        fs.appendFile(this.trafficFilePath, `${logLine}\n`, (error: NodeJS.ErrnoException | null) => {
          if (error) console.log(error);
        });
      }

      next();
    });
  }

  getAllBotsRequests(knownPathOptions: KnownPathOptions): string {
    return fs
      .readFileSync(this.trafficFilePath, "utf-8")
      .split("\n")
      .filter((log: string) => {
        const requestPath = log.split(" - ")[3];
        return log.includes("guest") && !PathClassifier.isKnownPath(requestPath, knownPathOptions).isKnown;
      })
      .map((log: string) => {
        const parts = log.split(" - ");
        parts.pop();
        parts.shift();
        return parts.join(" - ");
      })
      .join("\n");
  }

  private ensureLogFiles(): void {
    if (!fs.existsSync(this.trafficFilePath)) fs.writeFileSync(this.trafficFilePath, "");
    if (!fs.existsSync(this.botsFilePath)) fs.writeFileSync(this.botsFilePath, "");
  }
}
