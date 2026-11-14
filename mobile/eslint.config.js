const expo = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  { ignores: ['node_modules/', '.expo/', 'dist/', 'android/', 'ios/'] },
  expo,
  prettier,
]);
