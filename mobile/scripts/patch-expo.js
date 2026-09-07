const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', '@expo', 'cli', 'build', 'src', 'start', 'server', 'metro', 'externals.js');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  
  // Windows fix for Node 22+: modules with colons like node:sea cannot be created as directory names on Windows
  if (!content.includes("!x.includes(':')")) {
    content = content.replace(
      "!/^_|^(internal|v8|node-inspect)\\/|\\//.test(x) && ![",
      "!/^_|^(internal|v8|node-inspect)\\/|\\//.test(x) && !x.includes(':') && !["
    );
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-expo] Successfully patched @expo/cli externals.js for Windows Node.js compatibility.');
  } else {
    console.log('[patch-expo] @expo/cli is already patched.');
  }
} else {
  console.log('[patch-expo] Target externals.js not found, skipping patch.');
}
