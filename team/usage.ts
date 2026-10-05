import fs from "node:fs";
import path from "node:path";

// One JSON line per model call, so spend can be added up later by member and day.
// Token counts only; prices differ per model and change, so they aren't guessed here.

const LOG_FILE = path.resolve(process.env.TEAM_USAGE_LOG ?? "data/usage.jsonl");
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

export type UsageCounts = { input: number; output: number; cached: number };

export function recordUsage(source: string, counts: UsageCounts): void {
  const line = JSON.stringify({ at: new Date().toISOString(), source, ...counts });
  console.log(`[usage] ${source} in=${counts.input} out=${counts.output} cached=${counts.cached}`);
  fs.appendFile(LOG_FILE, line + "\n", (err) => {
    if (err) console.error("[usage] failed to write:", err);
  });
}
