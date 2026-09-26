import { GeneratedStockPrompt } from './promptSchema';

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // Double-quote escape internal quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function generateCsvContent(prompts: GeneratedStockPrompt[]): string {
  const headers = [
    'Prompt Number',
    'Subject',
    'Instructions',
    'Prompt',
    'Category',
    'Subcategory',
    'Content Type',
    'Commercial Use',
    'Aspect Ratio',
    'Negative Space',
    'Copy Space',
    'IP Risk',
    'Similarity Status'
  ];

  const rows: string[] = [headers.map(escapeCsvField).join(',')];

  prompts.forEach((p, idx) => {
    const row = [
      idx + 1,
      p.subject || '',
      p.instructions || '',
      p.prompt || '',
      p.category || 'General',
      p.subcategory || '',
      p.contentType || 'Photo',
      p.commercialUse || 'Advertising',
      p.aspectRatio || 'Default',
      p.negativeSpace || 'None',
      p.copySpace || '',
      p.ipRisk || 'LOW RISK',
      p.similarityStatus || 'DISTINCT'
    ];
    rows.push(row.map(escapeCsvField).join(','));
  });

  return rows.join('\r\n');
}

export function downloadCsvFile(content: string, filename: string) {
  // UTF-8 BOM (\uFEFF) ensures Excel and Google Sheets render UTF-8 (Bangla, accented characters) correctly
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
