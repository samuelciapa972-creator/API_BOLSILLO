// SAST con ESLint (proyecto final). Uso: npm run sast
// Analiza el backend (CommonJS). El frontend tiene su propia configuración.
import js from "@eslint/js";
import globals from "globals";
import security from "eslint-plugin-security";

export default [
  { ignores: ["node_modules/**"] },
  {
    files: ["src/**/*.js", "scripts/**/*.js"],
    languageOptions: { ecmaVersion: 2023, sourceType: "commonjs", globals: globals.node },
    plugins: { security },
    rules: {
      ...js.configs.recommended.rules,
      ...security.configs.recommended.rules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_|^next$|^req$|^res$" }],
    },
  },
];
