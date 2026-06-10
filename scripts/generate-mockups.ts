/**
 * Mockup file generator for express-honeypot-middleware
 *
 * Generates mockup files to disk for debugging/backup.
 * The actual middleware uses mockupGenerator.ts on-the-fly.
 *
 * Usage:
 *   bun run scripts/generate-mockups.ts
 *   bun run scripts/generate-mockups.ts --dry-run   # preview only
 *   bun run scripts/generate-mockups.ts --list-uncategorized
 */

import fs from "fs";
import path from "path";
import { ALL_ENDPOINTS, classifySpecific, genCatchall, generateMockup } from "../src/services/mockupGenerator";
import type { Variant } from "../src/services/mockupGenerator";

const MOCKUPS_DIR = path.resolve(__dirname, "..", "mockups");

const DRY_RUN = process.argv.includes("--dry-run");
const LIST_UNCATEGORIZED = process.argv.includes("--list-uncategorized");

function writeMockup(v: Variant, endpoint: string, content: string) {
  const rel = endpoint === "/" ? "index" : endpoint.replace(/^\//, "");
  const fp = path.join(MOCKUPS_DIR, v, rel, "index.mock");
  if (DRY_RUN) { console.log(`  ${v}  ${endpoint}`); return; }
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, content, "utf-8");
}

function writeBoth(endpoint: string, def: string, comp: string) {
  writeMockup("default", endpoint, def);
  writeMockup("complete", endpoint, comp);
}

function main() {
  const sorted = [...ALL_ENDPOINTS].sort();
  let catCount = 0;
  const uncategorized: string[] = [];

  for (const ep of sorted) {
    const gen = classifySpecific(ep);
    if (gen) {
      catCount++;
      writeBoth(ep, gen("default"), gen("complete"));
    } else {
      uncategorized.push(ep);
      writeBoth(ep, genCatchall("default", ep), genCatchall("complete", ep));
    }
  }

  if (LIST_UNCATEGORIZED && uncategorized.length > 0) {
    console.log(`\n=== ${uncategorized.length} catchall endpoints ===`);
    for (const ep of uncategorized) console.log(`  ${ep}`);
  }

  if (DRY_RUN) {
    console.log(`\n${sorted.length} endpoints total | ${catCount} specific | ${sorted.length - catCount} catchall`);
  } else {
    // Sync: remove files that exist on disk but are not in ALL_ENDPOINTS
    function scanVariant(v: Variant): string[] {
      const dir = path.join(MOCKUPS_DIR, v);
      if (!fs.existsSync(dir)) return [];
      const out: string[] = [];
      const walk = (d: string) => {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
          const f = path.join(d, e.name);
          if (e.isDirectory()) { walk(f); continue; }
          if (e.name !== "index.mock") continue;
          const rel = path.relative(dir, f).replace(/\/index\.mock$/, "");
          out.push(rel === "index" ? "/" : "/" + rel.split(path.sep).join("/"));
        }
      };
      walk(dir);
      return out;
    }

    for (const v of ["default", "complete"] as Variant[]) {
      for (const ep of scanVariant(v)) {
        if (!ALL_ENDPOINTS.includes(ep)) {
          const rel = ep === "/" ? "index" : ep.replace(/^\//, "");
          const fp = path.join(MOCKUPS_DIR, v, rel, "index.mock");
          if (fs.existsSync(fp)) {
            fs.rmSync(fp);
            let dir = path.dirname(fp);
            while (dir.startsWith(path.join(MOCKUPS_DIR, v)) && fs.readdirSync(dir).length === 0) {
              fs.rmdirSync(dir);
              dir = path.dirname(dir);
            }
          }
        }
      }
    }
    console.log(`Generated ${sorted.length * 2} files (${sorted.length} endpoints × 2 variants) | ${catCount} specific | ${sorted.length - catCount} catchall`);
  }
}

main();
