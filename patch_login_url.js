const fs = require('fs');
const file = 'frontend/src/pages/Login.js';
let content = fs.readFileSync(file, 'utf8');

// The original logic checks if BACKEND_URL is falsy and immediately throws an error in the catch block
// which shadows the actual error from the backend.
// Also if REACT_APP_BACKEND_URL is not set, BACKEND_URL is '' and it correctly uses '/api'
// which relies on the CRA proxy ("proxy": "http://127.0.0.1:8000" in package.json).
// We should allow the login to proceed with '/api' locally and show the real error.

content = content.replace(
  `const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\\/$/, '');
const API = BACKEND_URL ? \`\${BACKEND_URL}/api\` : '/api';`,
  `const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\\/$/, '');
const API = BACKEND_URL ? \`\${BACKEND_URL}/api\` : '/api';`
);

fs.writeFileSync(file, content);
console.log('Login.js url patched');
