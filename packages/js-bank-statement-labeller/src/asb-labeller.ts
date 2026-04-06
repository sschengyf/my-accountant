import * as xlsx from 'xlsx';
import { labelBankStatement, UnifiedRow } from './utils';

// Convert xlsx output date M/D/YY back to YYYY/MM/DD
export function normalizeDate(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3 && parts[2].length === 2 && parts[0].length <= 2) {
    return `20${parts[2]}/${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
  }
  return dateStr;
}

function parseAsbStatement(sheet: xlsx.WorkSheet): UnifiedRow[] {
  const allData: any[] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const ledgerBalanceRowNum = allData.findIndex(
    (row) => row[0] && typeof row[0] === 'string' && row[0].includes('Ledger Balance'),
  );

  const startRowNum = ledgerBalanceRowNum + 1;

  const rows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, {
    range: startRowNum,
    header: startRowNum,
    raw: false,
  });

  return rows.map((row) => ({
    Date: normalizeDate(row['Date']),
    Amount: row['Amount'],
    Payee: row['Payee'] || '',
    Memo: row['Memo'] || '',
    'Tran Type': row['Tran Type'] || '',
    Category: '',
  }));
}

export function labelAsbBankStatement(params: {
  bankStatementPath: string;
  ledgerPath: string;
  outputPath: string;
}) {
  labelBankStatement({ ...params, parseStatement: parseAsbStatement });
}
