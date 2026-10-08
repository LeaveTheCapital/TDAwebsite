import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";

import ts from "typescript";

const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
]);
const scriptExtensions = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
]);
const violations = [];

async function inspectDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      await inspectDirectory(path);
    } else {
      await inspectFile(path);
    }
  }
}

async function inspectFile(path) {
  const extension = extname(path);

  if (!scriptExtensions.has(extension) && extension !== ".html" && extension !== ".css") {
    return;
  }

  const source = await readFile(path, "utf8");

  if (scriptExtensions.has(extension)) {
    inspectScript(path, source);
  } else {
    inspectMarkup(path, source, extension === ".html" ? "<!--" : "/*");
  }
}

function inspectScript(path, source) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.JSX, source);

  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (
      token === ts.SyntaxKind.SingleLineCommentTrivia ||
      token === ts.SyntaxKind.MultiLineCommentTrivia
    ) {
      recordViolation(path, source, scanner.getTokenPos());
    }
  }
}

function inspectMarkup(path, source, marker) {
  let position = source.indexOf(marker);

  while (position !== -1) {
    recordViolation(path, source, position);
    position = source.indexOf(marker, position + marker.length);
  }
}

function recordViolation(path, source, position) {
  const line = source.slice(0, position).split("\n").length;
  violations.push(`${relative(root, path)}:${line}: comments are not allowed`);
}

await inspectDirectory(root);

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(violation);
  }

  process.exitCode = 1;
}
