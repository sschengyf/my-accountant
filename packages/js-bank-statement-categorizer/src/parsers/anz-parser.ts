import * as fs from 'fs';
import { Transaction } from '../types';

// Convert ANZ date DD/MM/YYYY to YYYY/MM/DD
export function normalizeDate(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3 && parts[0].length === 2) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function parseAnz(filePath: string): Transaction[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  const headers = lines[0].split(',');
  const idx = (name: string) => headers.indexOf(name);

  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    return {
      Date: normalizeDate(cols[idx('Date')]?.trim() || ''),
      'Tran Type': cols[idx('Type')]?.trim() || '',
      Payee: cols[idx('Details')]?.trim() || '',
      Memo: [cols[idx('Particulars')], cols[idx('Code')], cols[idx('Reference')]]
        .map((s) => s?.trim())
        .filter(Boolean)
        .join(' '),
      Amount: cols[idx('Amount')]?.trim() || '',
    };
  });
}
