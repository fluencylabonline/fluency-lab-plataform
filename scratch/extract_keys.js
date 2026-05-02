const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'app');
const ptJsonPath = path.join(__dirname, '..', 'messages', 'pt.json');
const enJsonPath = path.join(__dirname, '..', 'messages', 'en.json');

const ptJson = JSON.parse(fs.readFileSync(ptJsonPath, 'utf8'));
const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));

const targetNamespaces = ['Recess', 'Media', 'Survey'];

for (const ns of targetNamespaces) {
  if (!ptJson[ns]) ptJson[ns] = {};
  if (!enJson[ns]) enJson[ns] = {};
}

function extractTranslations(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      extractTranslations(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Determine which namespaces are used in this file
      const fileNamespaces = new Map(); // varName -> namespace
      
      const useRegex = /(const\s+([a-zA-Z0-9_]+)\s*=\s*useTranslations\(\s*['"]([^'"]+)['"]\s*\))/g;
      let match;
      while ((match = useRegex.exec(content)) !== null) {
        fileNamespaces.set(match[2], match[3]);
      }
      
      const getRegex = /(const\s+([a-zA-Z0-9_]+)\s*=\s*await\s+getTranslations\([^)]*namespace:\s*['"]([^'"]+)['"])/g;
      while ((match = getRegex.exec(content)) !== null) {
        fileNamespaces.set(match[2], match[3]);
      }

      // If this file uses any target namespace, extract its keys
      for (const [varName, ns] of fileNamespaces.entries()) {
        const rootNs = ns.split('.')[0];
        if (targetNamespaces.includes(rootNs)) {
          // Look for varName('key', ...) or varName("key", ...)
          // And optionally capture the fallback string: || "Fallback"
          const keyRegex = new RegExp(`${varName}\\(['"]([^'"]+)['"](?:,[^)]*)?\\)(?:\\s*\\|\\|\\s*(['"\`])(.*?)\\2)?`, 'g');
          let keyMatch;
          while ((keyMatch = keyRegex.exec(content)) !== null) {
            const key = keyMatch[1];
            const fallback = keyMatch[3] || key;
            
            // Nested namespace logic
            let currentPt = ptJson;
            let currentEn = enJson;
            const parts = ns.split('.');
            for (let i = 0; i < parts.length; i++) {
              if (!currentPt[parts[i]]) currentPt[parts[i]] = {};
              if (!currentEn[parts[i]]) currentEn[parts[i]] = {};
              currentPt = currentPt[parts[i]];
              currentEn = currentEn[parts[i]];
            }
            
            if (!currentPt[key]) {
              currentPt[key] = fallback;
            }
            if (!currentEn[key]) {
              currentEn[key] = fallback;
            }
          }
        }
      }
    }
  }
}

extractTranslations(srcDir);

fs.writeFileSync(ptJsonPath, JSON.stringify(ptJson, null, 2) + '\n');
fs.writeFileSync(enJsonPath, JSON.stringify(enJson, null, 2) + '\n');

console.log('Updated pt.json and en.json with missing namespaces and keys.');
