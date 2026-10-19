import { readFileSync, statSync } from "node:fs";
import { evaluate } from "../src/evaluate.ts";

try {
  const file = process.argv[2];
  if (!file || process.argv.length !== 3)
    throw new Error("Usage: npm run check -- path/to/report.json");
  if (statSync(file).size > 256_000)
    throw new Error("Report exceeds the 256 KB limit.");
  const verdict = evaluate(JSON.parse(readFileSync(file, "utf8")));
  console.log(JSON.stringify(verdict, null, 2));
  process.exitCode =
    verdict.status === "pass" ? 0 : verdict.status === "fail" ? 1 : 2;
} catch (error) {
  console.error(error instanceof Error ? error.message : "Cannot read report.");
  process.exitCode = 2;
}
