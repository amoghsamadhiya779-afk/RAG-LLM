const fs = require('fs');
const path = require('path');

// Patch vite-tanstack-config
const configPath = path.resolve('node_modules/@lovable.dev/vite-tanstack-config/dist/index.cjs');
const configPathEsm = path.resolve('node_modules/@lovable.dev/vite-tanstack-config/dist/index.js');
if (fs.existsSync(configPath)) {
  let content = fs.readFileSync(configPath, 'utf8');
  content = content.replace(/require\(['"]lovable-tagger['"]\)/g, '{componentTagger:()=>[]}');
  fs.writeFileSync(configPath, content);
}
if (fs.existsSync(configPathEsm)) {
  let contentEsm = fs.readFileSync(configPathEsm, 'utf8');
  contentEsm = contentEsm.replace(/import\s*\{[^}]+\}\s*from\s*['"]lovable-tagger['"];?/g, 'const componentTagger = () => [];');
  contentEsm = contentEsm.replace(/await\s+import\(['"]lovable-tagger['"]\)/g, 'Promise.resolve({componentTagger:()=>[]})');
  contentEsm = contentEsm.replace(/await\s+import\(['"]@tanstack\/devtools-vite['"]\)/g, 'Promise.resolve({devtools:()=>[]})');
  fs.writeFileSync(configPathEsm, contentEsm);
  console.log('Patched vite-tanstack-config');
}

// Patch nitro for Vite 6 compatibility
const nitroPath = path.resolve('node_modules/nitro/dist/vite.mjs');
if (fs.existsSync(nitroPath)) {
  let nitroContent = fs.readFileSync(nitroPath, 'utf8');
  nitroContent = nitroContent.replace(/ctx\._isRolldown = !!this\.meta\.rolldownVersion;/g, 'ctx._isRolldown = !!this?.meta?.rolldownVersion;');
  fs.writeFileSync(nitroPath, nitroContent);
  console.log('Patched nitro for Vite 6');
}
