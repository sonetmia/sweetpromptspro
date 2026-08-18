const fs = require('fs');

const file = 'src/components/SweetPrompts.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<motion\.button whileTap=\{\{ scale: 0\.95 \}\} onClick=\{onClick\}\n\s*disabled=\{off\}\n\s*onMouseEnter=\{\(\) => setHover\(true\)\}\n\s*onMouseLeave=\{\(\) => setHover\(false\)\}\n\s*style=\{\{\n\s*background: off\n\s*\? "rgba\(255,255,255,0\.06\)"\n\s*: `linear-gradient\(180deg, \$\{bg\} 0%, \$\{bg\}dd 100%\)`,\n\s*color: off \? C\.dim : "#fff",\n\s*border: off \? `1px solid \$\{C\.border2\}` : `1px solid \$\{bg\}`,\n\s*borderRadius: 11,\n\s*padding: "12px 26px",\n\s*fontSize: 14,\n\s*fontWeight: 700,\n\s*cursor: off \? "not-allowed" : "pointer",\n\s*fontFamily: "inherit",\n\s*position: "relative",\n\s*overflow: "hidden",\n\s*boxShadow: off \? "none" : \`0 0 \$\{hover \? "25px" : "15px"\} \$\{bg\}44, inset 0 1px 0 rgba\(255,255,255,0\.2\)\`,\n\s*transform: hover && !off \? "translateY\(-1px\)" : "none",\n\s*transition: "all \.25s cubic-bezier\(0\.4,0,0\.2,1\)",\n\s*display: "inline-flex",\n\s*alignItems: "center",\n\s*justifyContent: "center",\n\s*gap: 8,\n\s*\}\}/s;

const replacement = `<motion.button
      whileHover={!off ? { scale: 1.02, y: -2, boxShadow: \`0 0 25px \${bg}66, inset 0 1px 0 rgba(255,255,255,0.3)\` } : {}}
      whileTap={!off ? { scale: 0.96, y: 0 } : {}}
      onClick={onClick}
      disabled={off}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: off
          ? "rgba(255,255,255,0.06)"
          : \`linear-gradient(135deg, \${bg} 0%, \${bg}cc 100%)\`,
        color: off ? C.dim : "#fff",
        border: off ? \`1px solid \${C.border2}\` : \`1px solid \${bg}\`,
        borderRadius: 12,
        padding: "14px 28px",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "0.01em",
        cursor: off ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
        boxShadow: off ? "none" : \`0 0 15px \${bg}44, inset 0 1px 0 rgba(255,255,255,0.2)\`,
        transition: "all .3s cubic-bezier(0.25,1,0.5,1)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}`;

content = content.replace(regex, replacement);

fs.writeFileSync(file, content, 'utf8');
