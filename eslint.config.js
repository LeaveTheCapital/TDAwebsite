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
    files: ["eslint.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
  eslintConfigPrettier,
]);
