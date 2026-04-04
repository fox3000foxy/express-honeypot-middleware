"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrafficService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pathClassifier_1 = require("./pathClassifier");
class TrafficService {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.trafficFilePath = path_1.default.join(projectRoot, "traffic.txt");
        this.botsFilePath = path_1.default.join(projectRoot, "bots.txt");
        this.ensureLogFiles();
    }
    registerLoggingMiddleware(app, knownPathOptions) {
        app.use((req, _res, next) => {
            fs_1.default.writeFileSync(this.botsFilePath, this.getAllBotsRequests(knownPathOptions));
            if (!req.originalUrl.match(/\.(js|css|ico|png|jpg|jpeg|gif|svg|webp)$/) &&
                req.originalUrl !== "/support" &&
                req.headers["user-agent"] !== "local-honeypot-tester") {
                const logLine = `${new Date().toISOString()} - ${req.headers["x-forwarded-for"] || req.ip} - ${req.headers["user-agent"]} - ${req.method} ${req.originalUrl} - 200 - \"guest\"`;
                fs_1.default.appendFile(this.trafficFilePath, `${logLine}\n`, (error) => {
                    if (error)
                        console.log(error);
                });
            }
            next();
        });
    }
    getAllBotsRequests(knownPathOptions) {
        return fs_1.default
            .readFileSync(this.trafficFilePath, "utf-8")
            .split("\n")
            .filter((log) => {
            const requestPath = log.split(" - ")[3];
            return log.includes("guest") && !pathClassifier_1.PathClassifier.isKnownPath(requestPath, knownPathOptions).isKnown;
        })
            .map((log) => {
            const parts = log.split(" - ");
            parts.pop();
            parts.shift();
            return parts.join(" - ");
        })
            .join("\n");
    }
    ensureLogFiles() {
        if (!fs_1.default.existsSync(this.trafficFilePath))
            fs_1.default.writeFileSync(this.trafficFilePath, "");
        if (!fs_1.default.existsSync(this.botsFilePath))
            fs_1.default.writeFileSync(this.botsFilePath, "");
    }
}
exports.TrafficService = TrafficService;
