const fs = require('fs');
const file = 'frontend/craco.config.js';
let content = fs.readFileSync(file, 'utf8');

// The Vercel build error is: Module not found: Error: Can't resolve 'fs' in '.../face-api.js/build/es6/env'
// This happens because face-api.js attempts to use Node.js modules like 'fs' in a browser environment.
// Webpack 5 no longer provides polyfills for these. We need to tell Webpack to ignore/mock them via craco.

const webpackConfigPatch = `
      // Fix face-api.js "fs" module issue in browser
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "fs": false,
        "path": false,
        "crypto": false
      };

      // Add health check plugin to webpack if enabled
`;

content = content.replace(
  "      // Add health check plugin to webpack if enabled",
  webpackConfigPatch
);

fs.writeFileSync(file, content);
console.log('craco.config.js patched');
