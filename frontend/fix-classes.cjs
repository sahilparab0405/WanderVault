const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}
const files = walk('./src');
let fixCount = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('rounded- ') || content.includes('rounded-"')) {
    content = content.replace(/rounded- /g, 'rounded-xl ');
    content = content.replace(/rounded-"/g, 'rounded-xl"');
    fs.writeFileSync(f, content);
    console.log('Fixed rounded- in:', f);
    fixCount++;
  }
  
  // also fix inconsistent button padding "py-6" to "py-3" or "py-2.5" to make it consistent.
  // The audit mentioned: "Many buttons have py-6 (24px vertical padding) which creates very tall buttons. This is inconsistent — some are py-2.5 while CTAs are py-6"
  if (content.includes('py-6') || content.includes('py-6.5')) {
    // Let's replace py-6 and py-6.5 with py-3 in buttons/links if they look like buttons
    content = content.replace(/py-6\.5/g, 'py-3');
    content = content.replace(/py-6 /g, 'py-3 ');
    content = content.replace(/py-6"/g, 'py-3"');
    fs.writeFileSync(f, content);
    console.log('Fixed py-6 in:', f);
  }
});
console.log('Done, fixed', fixCount, 'files for rounded-');
