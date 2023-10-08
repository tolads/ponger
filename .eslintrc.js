module.exports = {
  extends: ['airbnb/base'],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        directory: './src/*/tsconfig.json',
      },
    },
  },
  globals: {
    window: true,
    document: true,
  },
  rules: {
    'import/extensions': 0,
    'lines-between-class-members': 0,
    'no-plusplus': 0,
    'no-mixed-operators': 0,
    'max-classes-per-file': 0,
    'no-unused-vars': 0, // because of TypeScript types
  },
};
