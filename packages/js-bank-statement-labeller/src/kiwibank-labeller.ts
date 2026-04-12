import * as xlsx from 'xlsx';
import { labelBankStatement, UnifiedRow } from './utils';

// xlsx auto-detects ISO dates (YYYY-MM-DD) correctly and formats them as M/D/YY with raw: false.
// Convert that M/D/YY back to YYYY/MM/DD for ledger matching.
export function normalizeDate(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3 && parts[2].length === 2 && parts[0].length <= 2) {
    return `20${parts[2]}/${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
  }
  return dateStr;
}

function parseKiwibankStatement(sheet: xlsx.WorkSheet): UnifiedRow[] {
  const rows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, { raw: false });

  return rows.map((row) => ({
    Date: normalizeDate(row['Effective Date'] || ''),
    Amount: row['Amount'] || '',
    Payee: row['Other Party Name']?.trim() || row['Description']?.trim() || '',
    Memo: [row['Description'], row['Particulars'], row['Code'], row['Reference']]
      .map((s) => s?.trim())
      .filter(Boolean)
      .join(' '),
    'Tran Type': row['Transaction Code'] || '',
    Category: '',
  }));
}

export function labelKiwibankBankStatement(params: {
  bankStatementPath: string;
  ledgerPath: string;
  outputPath: string;
}) {
  labelBankStatement({ ...params, parseStatement: parseKiwibankStatement });
}
