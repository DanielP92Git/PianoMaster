import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-vars": "warn",
      "react/prop-types": "off",
      "no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      "no-undef": "warn",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
  // Vitest test globals — eliminates ~320 no-undef warnings from test files
  // Also includes node globals for test files that use require() inside test cases
  {
    files: ["**/*.test.{js,jsx}", "**/*.spec.{js,jsx}", "src/test/**/*.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.vitest,
        ...globals.node,
      },
    },
  },
  // Node globals for config files — eliminates no-undef for module, process in config files
  {
    files: ["*.config.{js,cjs}", "*.config.{ts,mts}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // process.env in src files — Vite replaces process.env.NODE_ENV at build time
  {
    files: [
      "src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx",
      "src/contexts/SubscriptionContext.jsx",
      "src/services/accountDeletionService.js",
      "src/services/consentService.js",
    ],
    languageOptions: {
      globals: {
        process: "readonly",
      },
    },
  },
  // ServiceWorker globals for public/sw.js
  {
    files: ["public/sw.js"],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
  },
];
