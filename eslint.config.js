import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // Single-word component names are fine in this project
      'vue/multi-word-component-names': 'off',
      // Allow unused vars that start with _ (intentional ignores)
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Ignore generated/build files and setup scripts
    ignores: ['dist/**', 'android/**', 'ios/**', 'scripts/**'],
  },
]
