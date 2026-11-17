// SAST con ESLint para la SPA (proyecto final). Uso: npm run sast
// security: patrones peligrosos (regex, eval, rutas dinámicas).
// no-unsanitized: escrituras de HTML sin sanear (innerHTML, insertAdjacentHTML...).
import globals from "globals";
import security from "eslint-plugin-security";
import nounsanitized from "eslint-plugin-no-unsanitized";

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { security, "no-unsanitized": nounsanitized },
    rules: {
      ...security.configs.recommended.rules,
      "no-unsanitized/method": "error",
      "no-unsanitized/property": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
  },
];
