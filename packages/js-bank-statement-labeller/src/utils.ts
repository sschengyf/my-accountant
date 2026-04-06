import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

export type UnifiedRow = {
  Date: string;
  Amount: string;
  Payee: string;
  Memo: string;
  'Tran Type': string;
  Category: string;
};

export function createOutputDir(outputPath: string): void {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

// Convert ledger date M/DD/YY or M/D/YY (as parsed by xlsx from Money Wiz CSV) to YYYY/MM/DD
export function normalizeLedgerDate(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3 && parts[2].length === 2 && parts[0].length <= 2) {
    const year = `20${parts[2]}`;
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
  return dateStr;
}

export function labelBankStatement({
  bankStatementPath,
  ledgerPath,
  outputPath,
  parseStatement,
}: {
  bankStatementPath: string;
  ledgerPath: string;
  outputPath: string;
  parseStatement: (sheet: xlsx.WorkSheet) => UnifiedRow[];
}) {
  const bankStatement: xlsx.WorkBook = xlsx.readFile(bankStatementPath);
  const ledger: xlsx.WorkBook = xlsx.readFile(ledgerPath);

  const bankStatementSheet = bankStatement.Sheets[bankStatement.SheetNames[0]];
  const ledgerSheet = ledger.Sheets[ledger.SheetNames[0]];

  const rows = parseStatement(bankStatementSheet);

  const ledgerData: Record<string, any>[] = xlsx.utils.sheet_to_json(ledgerSheet, { raw: false });

  const columnToCopy = 'Category';
  const bankTransfers = 'Transfers';

  if (![bankTransfers, columnToCopy].find((col) => ledgerData[1]?.hasOwnProperty(col))) {
    console.error(
      `Neither column "${columnToCopy}" nor "${bankTransfers}" was found in ledger sheet.`,
    );
    process.exit(1);
  }

  for (const row of rows) {
    const matchingRow = ledgerData.find(
      (ledgerRow) =>
        ledgerRow['Date'] &&
        normalizeLedgerDate(ledgerRow['Date']) === row.Date &&
        ledgerRow['Amount'].replace(/,/g, '') === row.Amount.replace(/,/g, ''),
    );
    row.Category = matchingRow ? matchingRow[columnToCopy] : '';
  }

  const newSheet = xlsx.utils.json_to_sheet(rows);
  bankStatement.Sheets[bankStatement.SheetNames[0]] = newSheet;

  createOutputDir(outputPath);
  xlsx.writeFile(bankStatement, outputPath);

  console.log(`Labelled file saved to ${outputPath}`);
}
