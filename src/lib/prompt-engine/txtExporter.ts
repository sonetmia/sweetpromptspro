import { GeneratedStockPrompt } from './promptSchema';

export interface TxtExportOptions {
  subject?: string;
  instructions?: string;
  section?: string;
  filename?: string;
}

export function generateTxtContent(
  prompts: GeneratedStockPrompt[], 
  options: TxtExportOptions = {}
): string {
  const subject = options.subject || prompts[0]?.subject || 'Stock Concepts';
  const instructions = options.instructions || prompts[0]?.instructions || 'None';
  const count = prompts.length;
  const dateStr = new Date().toISOString().split('T')[0];

  let output = `========================================
SweetPrompts Pro
Adobe Stock Prompt Batch
========================================

Subject:
${subject}

Instructions:
${instructions}

Generated Date:
${dateStr}

Prompt Count:
${count}

========================================
`;

  prompts.forEach((p, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    output += `\n----------------------------------------\nPROMPT ${num}\n----------------------------------------\n`;
    output += `${p.prompt}\n\n`;
    output += `[Commercial Use: ${p.commercialUse || 'Commercial'} | Type: ${p.contentType || 'Photo'} | IP Risk: ${p.ipRisk || 'LOW RISK'}]\n`;
  });

  output += `\n========================================\nEnd of Batch (${count} Prompts)\nSweetPrompts Pro - Stock Contributor Suite\n========================================\n`;

  return output;
}

export function downloadTxtFile(content: string, filename: string) {
  // Ensure UTF-8 with BOM so international characters (Bangla, etc.) display cleanly
  const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
