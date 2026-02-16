import js from '@eslint/js';
import globals from 'globals';
import importXPlugin from 'eslint-plugin-import-x';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactPlugin from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

const ignoredPatterns = [
  '**/dist/**',
  '**/.next/**',
  '**/.turbo/**',
  '**/coverage/**',
  '**/eslint.config.*',
  '**/*.config.*',
  '**/next-env.d.ts',
  '**/public/sw.js',
];

const baseRules = {
  '@typescript-eslint/array-type': 'off',
  '@typescript-eslint/consistent-type-definitions': 'off',
  '@typescript-eslint/no-deprecated': 'off',
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-inferrable-types': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/require-await': 'off',
  '@typescript-eslint/restrict-template-expressions': 'off',
  'import-x/order': [
    'warn',
    {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true },
    },
  ],
  'no-console': 'warn',
  'no-unused-vars': 'off',
  'prefer-const': 'error',
  'react/react-in-jsx-scope': 'off',
};

const baseConfig = [
  { ignores: ignoredPatterns },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', '*.mjs', '*.cjs'],
        },
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: {
      'import-x': importXPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...baseRules,
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default baseConfig;
