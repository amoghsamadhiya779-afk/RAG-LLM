const fs = require('fs');
const path = require('path');

// Patch vite-tanstack-config
const configPath = path.resolve('node_modules/@lovable.dev/vite-tanstack-config/dist/index.cjs');
if (fs.existsSync(configPath)) {
  let content = fs.readFileSync(configPath, 'utf8');
  content = content.replace(/require\(['"]lovable-tagger['"]\)/g, '{componentTagger:()=>[]}');
  fs.writeFileSync(configPath, content);
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
