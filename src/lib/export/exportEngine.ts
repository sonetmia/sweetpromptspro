/**
 * SweetPrompts Pro - Central Export Engine
 * Handles client-side TXT, CSV, and JSON downloads with UTF-8 BOM support.
 */

export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatExportDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  } catch (err) {
    console.error('Failed to download file:', err);
  }
}

/**
 * Downloads a batch of prompts or text content as a single clean TXT file
 */
export function downloadTXT(content: string | string[], sectionName: string = 'batch'): void {
  const textBody = Array.isArray(content) 
    ? content.map((p, idx) => `[Prompt #${String(idx + 1).padStart(2, '0')}]\n${p}`).join('\n\n' + '='.repeat(40) + '\n\n')
    : content;

  const cleanSection = sanitizeFilename(sectionName);
  const filename = `sweetprompts-${cleanSection}-${formatExportDate()}.txt`;
  
  downloadFile(textBody, filename, 'text/plain;charset=utf-8;');
}

export interface CSVRowItem {
  id?: string | number;
  title?: string;
  prompt: string;
  category?: string;
  visualType?: string;
  aspectRatio?: string;
  copySpace?: string;
  keywords?: string | string[];
  riskLevel?: string;
}

/**
 * Downloads a collection of items as properly formatted UTF-8 CSV with quotes and comma escaping
 */
export function downloadCSV(
  data: CSVRowItem[] | Record<string, any>[] | string[],
  sectionName: string = 'batch'
): void {
  if (!data || data.length === 0) return;

  const cleanSection = sanitizeFilename(sectionName);
  const filename = `sweetprompts-${cleanSection}-${formatExportDate()}.csv`;

  // Case 1: Simple string array (array of prompts)
  if (typeof data[0] === 'string') {
    const lines = [
      '#,"Prompt"',
      ...(data as string[]).map((p, idx) => `${idx + 1},"${String(p).replace(/"/g, '""')}"`)
    ];
    // Prefix with UTF-8 BOM so Excel/Numbers accurately renders Unicode/Bangla characters
    const csvWithBom = '\uFEFF' + lines.join('\n');
    downloadFile(csvWithBom, filename, 'text/csv;charset=utf-8;');
    return;
  }

  // Case 2: Array of objects
  const records = data as Record<string, any>[];
  const keys = Object.keys(records[0]);
  const headerLine = keys.map(k => `"${String(k).replace(/"/g, '""')}"`).join(',');

  const rowLines = records.map(row => {
    return keys.map(k => {
      const val = row[k];
      if (Array.isArray(val)) {
        return `"${val.join(', ').replace(/"/g, '""')}"`;
      }
      return `"${String(val ?? '').replace(/"/g, '""')}"`;
    }).join(',');
  });

  const fullCsv = '\uFEFF' + [headerLine, ...rowLines].join('\n');
  downloadFile(fullCsv, filename, 'text/csv;charset=utf-8;');
}
