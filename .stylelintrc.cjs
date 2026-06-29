module.exports = {
  extends: ["stylelint-config-standard", "stylelint-config-standard-scss"],
  customSyntax: "postcss-scss",
  rules: {
    "alpha-value-notation": null,
    "at-rule-no-unknown": null,
    "color-function-notation": null,
    "custom-property-empty-line-before": null,
    "declaration-empty-line-before": null,
    "selector-class-pattern": [
      "^[a-z][a-zA-Z0-9]*$",
      {
        message: "Class names should use local camelCase.",
      },
    ],
    "scss/at-rule-no-unknown": true,
    "value-keyword-case": null,
  },
};
