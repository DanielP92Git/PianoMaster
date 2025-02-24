import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: ["react-hooks", "react-refresh"],
    rules: {
      ...js.configs.recommended.rules, // Ensure base ESLint rules are included
      ...reactHooks.configs.recommended.rules, // Correct usage of react-hooks recommended config
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
];
