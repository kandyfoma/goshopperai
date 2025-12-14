module.exports = {
  root: true,
  extends: ['react-app'],
  plugins: [],
  settings: {
    react: {
      version: 'detect'
    }
  },
  env: {
    browser: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    // Disable rules that conflict with create-react-app defaults
  }
};