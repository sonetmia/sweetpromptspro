import { downloadFile, downloadTXT, downloadCSV } from '../export/exportEngine';

export { downloadFile, downloadTXT, downloadCSV };

export function exportToCSV(
  dataOrHeaders: Record<string, any>[] | string[],
  filenameOrRows: string | (string | number)[][],
  optionalFilename?: string
) {
  // If called with (headers: string[], rows: string[][], filename: string)
  if (Array.isArray(dataOrHeaders) && typeof dataOrHeaders[0] === 'string' && Array.isArray(filenameOrRows)) {
    const headers = dataOrHeaders as string[];
    const rows = filenameOrRows as (string | number)[][];
    const filename = optionalFilename || 'export.csv';
    const csvRows = [headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',')];
    for (const row of rows) {
      const escaped = row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`);
      csvRows.push(escaped.join(','));
    }
    const fullCsv = '\uFEFF' + csvRows.join('\n');
    downloadFile(fullCsv, filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv;charset=utf-8;');
    return;
  }

  // If called with (data: Record<string, any>[], filename: string)
  const data = dataOrHeaders as Record<string, any>[];
  const filename = typeof filenameOrRows === 'string' ? filenameOrRows : 'export.csv';
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',')];

  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header] ?? '';
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const fullCsv = '\uFEFF' + csvRows.join('\n');
  downloadFile(fullCsv, filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv;charset=utf-8;');
}

export function exportToJSON(data: any, filename: string) {
  const content = JSON.stringify(data, null, 2);
  downloadFile(content, filename.endsWith('.json') ? filename : `${filename}.json`, 'application/json;charset=utf-8;');
}

export function exportToTXT(content: string, filename: string) {
  downloadFile(content, filename.endsWith('.txt') ? filename : `${filename}.txt`, 'text/plain;charset=utf-8;');
}

export function exportMetadataCSV(title: string, keywords: string[], category: string, contentType: string) {
  const csvContent = [
    'Title,Keywords,Category,Content Type',
    `"${title.replace(/"/g, '""')}","${keywords.join(', ').replace(/"/g, '""')}","${category}","${contentType}"`
  ].join('\n');

  const fullCsv = '\uFEFF' + csvContent;
  downloadFile(fullCsv, `adobe-stock-metadata-${Date.now()}.csv`, 'text/csv;charset=utf-8;');
}

export function exportPromptTXT(prompt: string, title?: string) {
  const content = `${title ? title + '\n\n' : ''}${prompt}`;
  downloadFile(content, `sweetprompt-${Date.now()}.txt`, 'text/plain;charset=utf-8;');
}

export function exportPromptJSON(data: any) {
  const content = JSON.stringify(data, null, 2);
  downloadFile(content, `sweetprompt-data-${Date.now()}.json`, 'application/json;charset=utf-8;');
}
