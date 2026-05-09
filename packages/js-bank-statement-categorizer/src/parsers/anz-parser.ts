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

type ColGetter = (name: string) => string;
type FieldExtractor = (col: ColGetter) => { payee: string; memo: string };

const joinMemo = (...fields: string[]) => fields.filter(Boolean).join(' ');

const visaExtractor: FieldExtractor = (col) => ({
  payee: col('Code'),
  memo: joinMemo(col('Details'), col('Reference')),
});

// Add a new entry here to handle payee/memo extraction for a specific transaction type.
const fieldExtractors: Record<string, FieldExtractor> = {
  'Visa Purchase': visaExtractor,
  'Visa Refund': visaExtractor,
};

const defaultFieldExtractor: FieldExtractor = (col) => ({
  payee: col('Details'),
  memo: joinMemo(col('Particulars'), col('Code'), col('Reference')),
});

export function parseAnz(filePath: string): Transaction[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  const headers = lines[0].split(',');
  const idxOf = (name: string) => headers.indexOf(name);

  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    const col = (name: string) => cols[idxOf(name)]?.trim() || '';
    const type = col('Type');
    const extractor = fieldExtractors[type] ?? defaultFieldExtractor;
    const { payee, memo } = extractor(col);
    return {
      Date: normalizeDate(col('Date')),
      'Tran Type': type,
      Payee: payee,
      Memo: memo,
      Amount: col('Amount'),
    };
  });
}
