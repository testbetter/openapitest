module.exports = {
  env: {
    browser: false,
    mocha: true,
    es6: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
      semi: 'off',
      'no-use-before-define': 'off',
      'no-console': 'off',
      'no-restricted-syntax': 'off', // temporary
      'class-methods-use-this': 'off' // temporary
  },
};
