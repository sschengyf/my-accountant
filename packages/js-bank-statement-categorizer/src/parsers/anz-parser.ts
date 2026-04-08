import * as xlsx from 'xlsx';
import { Transaction } from '../types';

// Convert ANZ date DD/MM/YYYY to YYYY/MM/DD
function normalizeDate(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3 && parts[0].length === 2) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function parseAnz(workbook: xlsx.WorkBook): Transaction[] {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // ANZ CSV has no metadata rows — header is row 0
  const rows = xlsx.utils.sheet_to_json<ANZRow>(sheet, { raw: false });

  return rows.map((row) => ({
    Date: normalizeDate(row['Date']),
    'Tran Type': row['Type'] || '',
    Payee: row['Details'] || '',
    Memo: [row['Particulars'], row['Code'], row['Reference']].filter(Boolean).join(' '),
    Amount: row['Amount'],
  }));
}

type ANZRow = {
  Type: string;
  Details: string;
  Particulars: string;
  Code: string;
  Reference: string;
  Amount: string;
  Date: string;
};
