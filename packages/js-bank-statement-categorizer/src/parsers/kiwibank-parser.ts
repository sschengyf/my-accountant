import * as fs from 'fs';
import { Transaction } from '../types';

// Parse a single CSV line respecting double-quoted fields
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let field = '';
  let inQuotes = false;

  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  result.push(field);
  return result;
}

// Convert Kiwibank date YYYY-MM-DD to YYYY/MM/DD
export function normalizeDate(dateStr: string): string {
  return dateStr.replace(/-/g, '/');
}

export function parseKiwibank(filePath: string): Transaction[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  const headers = parseCsvLine(lines[0]);
  const idx = (name: string) => headers.indexOf(name);

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const otherParty = cols[idx('Other Party Name')]?.trim();
    return {
      Date: normalizeDate(cols[idx('Effective Date')]?.trim() || ''),
      'Tran Type': cols[idx('Transaction Code')]?.trim() || '',
      Payee: otherParty || cols[idx('Description')]?.trim() || '',
      Memo: [
        cols[idx('Description')],
        cols[idx('Particulars')],
        cols[idx('Code')],
        cols[idx('Reference')],
      ]
        .map((s) => s?.trim())
        .filter(Boolean)
        .join(' '),
      Amount: cols[idx('Amount')]?.trim() || '',
    };
  });
}
