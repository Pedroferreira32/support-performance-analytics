import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname);
const appSource = resolve(root, "dashboard-app.js");
const output = resolve(root, "dashboard.js");

if (!existsSync(appSource)) {
  writeFileSync(appSource, readFileSync(output));
}

const sources = [
  "vendor/jszip.min.js",
  "vendor/pptxgen.min.js",
  "powerpoint.js",
  "dashboard-app.js",
];

const bundle = [
  "/* Dashboard local autocontido: JSZip + PptxGenJS + gerador + aplicação. */",
  ...sources.map((name) => `\n/* Início: ${name} */\n${readFileSync(resolve(root, name), "utf8")}\n/* Fim: ${name} */\n`),
].join("\n");

writeFileSync(output, bundle, "utf8");
console.log(`Bundle atualizado: ${output}`);
