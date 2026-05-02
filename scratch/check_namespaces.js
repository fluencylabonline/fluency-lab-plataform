const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'app');
const ptJsonPath = path.join(__dirname, '..', 'messages', 'pt.json');

const ptJson = JSON.parse(fs.readFileSync(ptJsonPath, 'utf8'));
const existingNamespaces = Object.keys(ptJson);

const usedNamespaces = new Set();

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Match useTranslations("Namespace") or useTranslations('Namespace')
      const useRegex = /useTranslations\(\s*['"]([^'"]+)['"]\s*\)/g;
      let match;
      while ((match = useRegex.exec(content)) !== null) {
        usedNamespaces.add(match[1].split('.')[0]); // Take root
      }
      
      // Match getTranslations({ namespace: "Namespace" }) or getTranslations({ ..., namespace: 'Namespace' })
      const getRegex = /getTranslations\([^)]*namespace:\s*['"]([^'"]+)['"]/g;
      while ((match = getRegex.exec(content)) !== null) {
        usedNamespaces.add(match[1].split('.')[0]); // Take root
      }
    }
  }
}

scanDir(srcDir);

console.log("Used root namespaces in code:");
const usedArr = Array.from(usedNamespaces).sort();
console.log(usedArr);

console.log("\nNamespaces in pt.json:");
console.log(existingNamespaces.sort());

const missingNamespaces = usedArr.filter(ns => !existingNamespaces.includes(ns));

console.log("\nMissing Root Namespaces in pt.json:");
if (missingNamespaces.length > 0) {
  console.log(missingNamespaces);
} else {
  console.log("None! All root namespaces are present.");
}
