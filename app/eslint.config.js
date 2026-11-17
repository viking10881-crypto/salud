// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // TypeScript ya valida los imports de namespace; esta regla da falsos positivos
      // con enums compilados (p. ej. Notifications.AndroidImportance de expo-notifications).
      'import/namespace': 'off',
    },
  },
]);
