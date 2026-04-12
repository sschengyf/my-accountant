import * as xlsx from 'xlsx';
import { Transaction } from '../types';

export function parseAsb(filePath: string): Transaction[] {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const allData: any[] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const ledgerBalanceRowNum = allData.findIndex(
    (row) => row[0] && typeof row[0] === 'string' && row[0].includes('Ledger Balance'),
  );

  const startRowNum = ledgerBalanceRowNum + 1;

  const rows = xlsx.utils.sheet_to_json<ASBRow>(sheet, {
    range: startRowNum,
    header: startRowNum,
    raw: false,
  });

  return rows.map((row) => ({
    Date: row['Date'],
    'Tran Type': row['Tran Type'] || '',
    Payee: row['Payee'] || '',
    Memo: row['Memo'] || '',
    Amount: row['Amount'],
  }));
}

type ASBRow = {
  Date: string;
  'Unique Id': string;
  'Tran Type': string;
  Payee: string;
  Memo: string;
  Amount: string;
};
