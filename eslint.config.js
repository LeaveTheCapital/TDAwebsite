const js = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const eslintConfigPrettier = require("eslint-config-prettier/flat");
const html = require("eslint-plugin-html");
const globals = require("globals");

module.exports = defineConfig([
  {
    files: ["**/*.{js,html}"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
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
    files: ["eslint.config.js", "playwright.config.js", "tests/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
  {
    files: ["drawGrid.js"],
    languageOptions: {
      globals: {
        drawLineXForwards: "readonly",
        height: "readonly",
        letterWidth: "readonly",
        numberOfLetters: "readonly",
        paddingAroundLetters: "readonly",
      },
    },
    rules: {
      "no-constant-condition": "off",
      "no-unused-vars": ["error", { varsIgnorePattern: "^drawGrid$" }],
    },
  },
  {
    files: ["script.js"],
    languageOptions: {
      globals: {
        getName: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^nameInput$" }],
    },
  },
  eslintConfigPrettier,
]);
