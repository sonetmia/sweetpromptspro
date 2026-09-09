const fs = require('fs');

const file = 'src/styles.css';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('perspective-1000')) {
  content += `\n
@utility perspective-1000 {
  perspective: 1000px;
}
@utility transform-style-3d {
  transform-style: preserve-3d;
}
`;
  fs.writeFileSync(file, content, 'utf8');
}
