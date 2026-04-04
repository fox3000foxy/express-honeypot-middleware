import { KnownPathOptions } from "../types";
export interface KnownPathResult {
    isKnown: boolean;
    type: "api" | "page" | "unknown";
}
export declare class PathClassifier {
    static normalizePath(inputPath: string): string;
    static isKnownPath(inputPath: string, options: KnownPathOptions): KnownPathResult;
}
