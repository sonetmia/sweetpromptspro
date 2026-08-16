const fs = require('fs');

const file = 'src/components/SweetPrompts.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `<span className="block" style={{ height: "1.2em" }}><TypewriterEffect words={["Sweet Prompts Pro", "Microstock Journey With Sonet", "Sweet Prompts"]} /></span>`;

// Use a more robust replace that finds from <span className="block" ... to </h1>
const startRegex = /<span className="block" style=\{\{ height: "1\.2em" \}\}>.*?<\/span>/s;

content = content.replace(
  /<span className="block" style=\{\{ height: "1\.2em" \}\}>.*?<\/span>\s*\/\* <ShinyText[\s\S]*?spread=\{100\} \/> \*\/\s*\/>/s,
  replacement
);

fs.writeFileSync(file, content, 'utf8');
