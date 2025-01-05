import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Correctly define __dirname for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  {
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname, // Use __dirname here
        sourceType: 'module',
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        process: 'readonly',
        console: 'readonly',
        beforeAll: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      prettier: prettierPlugin,
      jest: jestPlugin,
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },
];
