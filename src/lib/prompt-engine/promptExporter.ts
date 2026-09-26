import { GeneratedStockPrompt } from './promptSchema';
import { generateTxtContent, downloadTxtFile } from './txtExporter';
import { generateCsvContent, downloadCsvFile } from './csvExporter';

export interface ExporterOptions {
  subject?: string;
  instructions?: string;
  section?: string;
  customFilename?: string;
}

export function sanitizeFilenameSlug(text: string): string {
  if (!text) return 'prompts';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'prompts';
}

export function generateExportFilename(subject: string = '', extension: 'txt' | 'csv'): string {
  const slug = sanitizeFilenameSlug(subject);
  const dateStr = new Date().toISOString().split('T')[0];
  return `sweetprompts-${slug}-${dateStr}.${extension}`;
}

export class UniversalPromptExporter {
  /**
   * Downloads all prompts as a structured .txt file
   */
  static downloadTXT(prompts: GeneratedStockPrompt[], options: ExporterOptions = {}) {
    if (!prompts || prompts.length === 0) return;
    const filename = options.customFilename || generateExportFilename(options.subject || prompts[0]?.subject, 'txt');
    const content = generateTxtContent(prompts, options);
    downloadTxtFile(content, filename);
  }

  /**
   * Downloads all prompts as a compliant .csv file
   */
  static downloadCSV(prompts: GeneratedStockPrompt[], options: ExporterOptions = {}) {
    if (!prompts || prompts.length === 0) return;
    const filename = options.customFilename || generateExportFilename(options.subject || prompts[0]?.subject, 'csv');
    const content = generateCsvContent(prompts);
    downloadCsvFile(content, filename);
  }

  /**
   * Copies all generated prompts to clipboard in clean numbered format
   */
  static copyAllToClipboard(prompts: GeneratedStockPrompt[]): Promise<boolean> {
    if (!prompts || prompts.length === 0) return Promise.resolve(false);
    
    let text = '';
    prompts.forEach((p, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      text += `PROMPT ${num}\n${p.prompt}\n\n`;
    });

    return navigator.clipboard.writeText(text.trim())
      .then(() => true)
      .catch((err) => {
        console.error('Clipboard copy failed:', err);
        return false;
      });
  }
}
