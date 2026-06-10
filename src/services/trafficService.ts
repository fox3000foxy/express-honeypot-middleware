import fs from "fs";
import path from "path";
import { KnownPathOptions } from "../types";
import { PathClassifier } from "./pathClassifier";

export interface TrafficLogEntry {
  timestamp: string;
  ip: string;
  userAgent: string;
  method: string;
  path: string;
  status: number;
  user: string;
}

export class TrafficService {
  private readonly trafficFilePath: string;
  private readonly botsFilePath: string;

  constructor(private readonly projectRoot: string) {
    this.trafficFilePath = path.join(projectRoot, "traffic.txt");
    this.botsFilePath = path.join(projectRoot, "bots.txt");
    this.ensureLogFiles();
  }

  createLoggingMiddleware(): (req: any, _res: any, next: any) => void {
    return (req: any, _res: any, next: any) => {
      this.logRequest(req).catch(() => {});
      next?.();
    };
  }

  private shouldLogRequest(req: any): boolean {
    if (req.originalUrl?.match(/\.(js|css|ico|png|jpg|jpeg|gif|svg|webp)$/)) {
      return false;
    }
    if (req.originalUrl === "/support") {
      return false;
    }
    if (req.headers?.["user-agent"] === "local-honeypot-tester") {
      return false;
    }
    return true;
  }

  async logRequest(req: any): Promise<void> {
    if (!this.shouldLogRequest(req)) return;

    const entry: TrafficLogEntry = {
      timestamp: new Date().toISOString(),
      ip: req.headers?.["x-forwarded-for"] || req.ip || "unknown",
      userAgent: req.headers?.["user-agent"] || "unknown",
      method: req.method,
      path: req.originalUrl || req.url,
      status: 200,
      user: "guest",
    };

    await fs.promises.appendFile(this.trafficFilePath, JSON.stringify(entry) + "\n", "utf-8");
  }

  async getBotRequests(knownPathOptions: KnownPathOptions): Promise<TrafficLogEntry[]> {
    try {
      const content = await fs.promises.readFile(this.trafficFilePath, "utf-8");
      const bots: TrafficLogEntry[] = [];

      for (const line of content.split("\n").filter(Boolean)) {
        try {
          const entry: TrafficLogEntry = JSON.parse(line);
          if (entry.user === "guest" && !PathClassifier.isKnownPath(entry.path, knownPathOptions).isKnown) {
            bots.push(entry);
          }
        } catch {
          // skip malformed lines
        }
      }

      return bots;
    } catch {
      return [];
    }
  }

  async writeBotsFile(bots: TrafficLogEntry[]): Promise<void> {
    const content = bots
      .map((entry) =>
        `${entry.timestamp} - ${entry.ip} - ${entry.userAgent} - ${entry.method} ${entry.path} - ${entry.status}`,
      )
      .join("\n");
    await fs.promises.writeFile(this.botsFilePath, content, "utf-8");
  }

  private ensureLogFiles(): void {
    if (!fs.existsSync(this.trafficFilePath)) {
      fs.writeFileSync(this.trafficFilePath, "");
    }
    if (!fs.existsSync(this.botsFilePath)) {
      fs.writeFileSync(this.botsFilePath, "");
    }
  }
}
