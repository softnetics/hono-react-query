import eslint from '@eslint/js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
// plugins
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort'
import unusedImportsPlugin from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'
var ignores = [
  'node_modules',
  '.pnp',
  '.pnp.js',
  'coverage',
  '.next/',
  'out/',
  'build',
  '.DS_Store',
  '*.pem',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  '.env',
  '.env.local',
  '.env.development.local',
  '.env.test.local',
  '.env.production.local',
  '.turbo',
  '.vercel',
  'dist',
  'data',
]
/**
 * @type {import('typescript-eslint').ConfigArray}
 */
var config = tseslint.config(
  { ignores: ignores },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    plugins: {
      'unused-imports': unusedImportsPlugin,
      'simple-import-sort': simpleImportSortPlugin,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Side effect imports.
            ['^\\u0000'],
            // React
            ['^react'],
            // Node.js builtins prefixed with `node:`.
            ['^node:'],
            // Absolute imports and other imports such as Vue-style `@app/foo`.  Anything not matched in another group.
            ['^'],
            // Internal aliases. Anything that starts with `~`.
            ['^~'],
            // Relative imports. Anything that starts with a dot.
            ['^\\.'],
            // Relative imports from outside. Anything that starts with a dot.
            ['^\\.\\.'],
          ],
        },
      ],
    },
  },
  // Override some rules
  {
    files: ['*.js', '*.cjs'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-undef': 'off',
    },
  }
)
export default config
