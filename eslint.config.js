import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import html from "eslint-plugin-html";
import globals from "globals";
import tseslint from "typescript-eslint";

const typedFiles = [
  "src/**/*.ts",
  "tests/**/*.ts",
  "playwright.config.ts",
  "vite.config.ts",
];

const sourcePolicy = {
  rules: {
    "no-comments": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          forbidden: "Comments are not allowed.",
        },
      },
      create(context) {
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              context.report({ node: comment, messageId: "forbidden" });
            }
          },
        };
      },
    },
  },
};

export default defineConfig([
  {
    ignores: ["dist/**", "playwright-report/**", "test-results/**"],
  },
  {
    files: ["**/*.{js,html}"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: globals.browser,
    },
  },
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: typedFiles,
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        ...config.languageOptions?.parserOptions,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  })),
  {
    files: ["**/*.{js,ts}"],
    plugins: {
      sourcePolicy,
    },
    rules: {
      "sourcePolicy/no-comments": "error",
    },
  },
  {
    files: typedFiles,
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-check": true,
          "ts-expect-error": true,
          "ts-ignore": true,
          "ts-nocheck": true,
        },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
    },
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["**/*.html"],
    plugins: { html },
    settings: {
      "html/indent": "0",
      "html/report-bad-indent": "error",
    },
  },
  {
    files: [
      "eslint.config.js",
      "vite.config.ts",
      "playwright.config.ts",
      "tests/**/*.ts",
    ],
    languageOptions: {
      sourceType: "module",
      globals: globals.node,
    },
  },
  {
    files: ["**/*.d.ts"],
    rules: {
      "no-var": "off",
    },
  },
  eslintConfigPrettier,
]);
