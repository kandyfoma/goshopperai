// Generate rounded favicon from logo
const fs = require('fs');
const path = require('path');

// For now, we'll just copy the logo.png as favicon
// Modern browsers support PNG favicons
const sourcePath = path.join(__dirname, 'public', 'logo192.png');
const destPath = path.join(__dirname, 'public', 'favicon.png');

fs.copyFileSync(sourcePath, destPath);
console.log('✓ Created favicon.png from rounded logo');
console.log('Note: Modern browsers support PNG favicons. For .ico support, use an online converter.');
