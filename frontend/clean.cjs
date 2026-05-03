const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove style={{ fontFamily: "..." }} completely if it's the only style
      content = content.replace(/style=\{\{\s*fontFamily:\s*['"][^'"]+['"]\s*\}\}/g, '');
      // Remove fontFamily from style object if there are other styles (e.g. style={{ fontFamily: "...", fontSize: "12px" }})
      content = content.replace(/style=\{\{\s*fontFamily:\s*['"][^'"]+['"]\s*,/g, 'style={{');
      // Remove , fontFamily: "..." from style object (e.g. style={{ fontSize: "12px", fontFamily: "..." }})
      content = content.replace(/,\s*fontFamily:\s*['"][^'"]+['"]/g, '');
      
      // Also remove inline fontFamily prop (e.g. fontFamily="Inter, sans-serif")
      content = content.replace(/fontFamily=['"][^'"]+['"]/g, '');
      
      // Fix empty style object that might be left: style={{ }} -> removed
      content = content.replace(/style=\{\{\s*\}\}/g, '');

      // Standardize border radius to xl, 2xl, 3xl
      // Map rounded-sm, rounded-md, rounded-lg, rounded to rounded-xl
      content = content.replace(/\brounded(-sm|-md|-lg|)\b/g, 'rounded-xl');
      
      // Standardize padding spacing (replace p-4, p-5 with p-6)
      content = content.replace(/\b(p|px|py|pt|pb|pl|pr)-[345]\b/g, '$1-6');
      content = content.replace(/\b(p|px|py|pt|pb|pl|pr)-7\b/g, '$1-8');
      
      fs.writeFileSync(fullPath, content);
    }
  });
}

processDir('c:/Users/sahil parab/WanderVault/frontend/src');
console.log('Replacements done.');
