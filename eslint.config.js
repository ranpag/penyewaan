// eslint.config.js
import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";

export default [
    js.configs.recommended, 
    {
        files: ["app/**/*.{ts,js}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.json",
                sourceType: "module"
            },
            globals: {
                process: "readonly",
                console: "readonly"
            }
        },
        plugins: {
            "@typescript-eslint": ts,
            prettier: prettier
        },
        rules: {
            "prettier/prettier": "error",
            "no-console": "warn",
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/explicit-module-boundary-types": "off"
        }
    }
];
