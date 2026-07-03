const fs = require('fs');
const path = require('path');
const configPath = path.resolve('node_modules/@lovable.dev/vite-tanstack-config/dist/index.cjs');
let content = fs.readFileSync(configPath, 'utf8');
content = content.replace(/require\(['"]lovable-tagger['"]\)/g, '{componentTagger:()=>[]}');
fs.writeFileSync(configPath, content);
console.log('Patched vite-tanstack-config');
