const fs = require('fs');
const file = 'src/components/SweetPrompts.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /whileHover=\{\{ scale: 1\.05, rotateY: 5, rotateX: -5, translateZ: 20 \}\}\n\s*whileTap=\{\{ scale: 0\.95 \}\}/g;
const replacement = `whileHover={{ scale: 1.05, rotateY: 5, rotateX: -5, z: 20, boxShadow: "0 15px 40px rgba(0,0,0,0.4), 0 0 40px rgba(255,255,255,0.2)" }}\n            whileTap={{ scale: 0.95, z: 0 }}`;

content = content.replace(regex, replacement);

fs.writeFileSync(file, content, 'utf8');
