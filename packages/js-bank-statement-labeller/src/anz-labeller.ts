import * as xlsx from 'xlsx';
import { labelBankStatement, UnifiedRow } from './utils';

// xlsx misreads ANZ dates where day <= 12 as US-format MM/DD/YYYY serial numbers.
// This fixes those cells by swapping day and month back before parsing.
export function fixAnzDateCells(sheet: xlsx.WorkSheet): void {
  const range = xlsx.utils.decode_range(sheet['!ref'] || 'A1');

  let dateColIndex = -1;
  for (let C = range.s.c; C <= range.e.c; C++) {
    const headerCell = sheet[xlsx.utils.encode_cell({ r: range.s.r, c: C })];
    if (headerCell && headerCell.v === 'Date') {
      dateColIndex = C;
      break;
    }
  }
  if (dateColIndex === -1) return;

  for (let R = range.s.r + 1; R <= range.e.r; R++) {
    const cell = sheet[xlsx.utils.encode_cell({ r: R, c: dateColIndex })];
    if (cell && cell.t === 'n') {
      // Serial number means xlsx misread DD/MM as MM/DD — swap day and month back
      const parsed = xlsx.SSF.parse_date_code(cell.v);
      const day = String(parsed.m).padStart(2, '0');   // "month" is actually the day
      const month = String(parsed.d).padStart(2, '0'); // "day" is actually the month
      cell.t = 's';
      cell.v = `${day}/${month}/${parsed.y}`;
      delete cell.w;
    }
  }
}

// Convert ANZ bank statement date DD/MM/YYYY to YYYY/MM/DD
export function normalizeBankDate(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3 && parts[0].length === 2) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function parseAnzStatement(sheet: xlsx.WorkSheet): UnifiedRow[] {
  fixAnzDateCells(sheet);

  const rows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, { raw: false });

  return rows.map((row) => ({
    Date: normalizeBankDate(row['Date']),
    Amount: row['Amount'],
    Payee: row['Details'] || '',
    Memo: [row['Particulars'], row['Code'], row['Reference']].filter(Boolean).join(' '),
    'Tran Type': row['Type'] || '',
    Category: '',
  }));
}

export function labelAnzBankStatement(params: {
  bankStatementPath: string;
  ledgerPath: string;
  outputPath: string;
}) {
  labelBankStatement({ ...params, parseStatement: parseAnzStatement });
}
