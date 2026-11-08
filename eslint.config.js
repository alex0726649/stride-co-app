// eslint.config.js
// Configuración "flat config" de ESLint 9 para un backend Express en CommonJS.
// Instalar con: npm install --save-dev eslint @eslint/js

const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        // Globals de Node.js (CommonJS)
        require: 'readonly',
        module: 'readonly',
        exports: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off', // Morgan/console.log son útiles en este sprint
      'no-undef': 'error',
      'eqeqeq': ['error', 'always'],
      'prefer-const': 'warn',
    },
  },
  {
    // Reglas relajadas para archivos de prueba (Jest agrega sus propios globals)
    files: ['test/**/*.test.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
  {
    ignores: ['node_modules/', 'coverage/'],
  },
];
