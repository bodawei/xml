// babel.config.js
module.exports = {
  // Must run before @babel/preset-typescript, which is why it is a plugin (plugins run first).
  plugins: ['./babel-plugin-omit-uninitialized-fields.js'],
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ],
};
