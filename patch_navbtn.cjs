const fs = require('fs');

const file = 'src/components/SweetPrompts.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<motion\.button whileTap=\{\{ scale: 0\.95 \}\} onClick=\{onClick\}\n\s*className=\{`whitespace-nowrap px-\[14px\] py-\[6px\] text-\[13\.5px\] rounded-full font-inherit cursor-pointer transition-all duration-200 \$\{active \? "bg-white\/10 text-white font-semibold shadow-\[0_0_15px_rgba\\(255,255,255,0\.1\\)\]" : "bg-transparent text-white\/75 font-medium hover:bg-white\/5 hover:text-white"\}`\}/s;

const replacement = `<motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={\`whitespace-nowrap px-[16px] py-[8px] text-[13.5px] rounded-full font-inherit cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] \${active ? "bg-white/15 text-white font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/10" : "bg-transparent text-white/70 font-medium hover:bg-white/10 hover:text-white"}\`}`;

content = content.replace(regex, replacement);

const regexDrop = /<motion\.button whileTap=\{\{ scale: 0\.95 \}\} onClick=\{\(\) => setOpen\(!open\)\}\n\s*className=\{`flex items-center gap-1 whitespace-nowrap px-\[14px\] py-\[6px\] text-\[13\.5px\] rounded-full font-inherit cursor-pointer transition-all duration-200 \$\{\(open \|\| active\) \? "bg-white\/10 text-white font-semibold shadow-\[0_0_15px_rgba\\(255,255,255,0\.1\\)\]" : "bg-transparent text-white\/75 font-medium hover:bg-white\/5 hover:text-white"\}`\}/s;

const dropReplacement = `<motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className={\`flex items-center gap-1 whitespace-nowrap px-[16px] py-[8px] text-[13.5px] rounded-full font-inherit cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] \${(open || active) ? "bg-white/15 text-white font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/10" : "bg-transparent text-white/70 font-medium hover:bg-white/10 hover:text-white"}\`}`;

content = content.replace(regexDrop, dropReplacement);

fs.writeFileSync(file, content, 'utf8');
