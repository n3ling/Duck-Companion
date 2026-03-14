module.exports = {
  env: {
    browser: true,
    es2022: true,
  },
  globals: {
    chrome: "readonly",
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "script",
  },
  rules: {
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
};
