const fs = require('fs');
const file = 'frontend/src/pages/Login.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `      if (!BACKEND_URL) {
        toast.error('Backend URL is not configured. Set REACT_APP_BACKEND_URL in Vercel project environment variables.');
      } else {
        toast.error(error.response?.data?.detail || 'Authentication failed. Please try again.');
      }`,
  `      if (error.response) {
        toast.error(error.response.data?.detail || 'Authentication failed. Please try again.');
      } else if (!BACKEND_URL && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        toast.error('Backend URL is not configured. Set REACT_APP_BACKEND_URL in Vercel project environment variables.');
      } else {
        toast.error('Network error. Is the backend running?');
      }`
);

fs.writeFileSync(file, content);
console.log('Login.js patched');
