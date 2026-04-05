import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

function createOutputDir(outputPath: string): void {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

// Convert ANZ bank statement date DD/MM/YYYY to YYYY/MM/DD
function normalizeBankDate(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3 && parts[0].length === 2) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Convert ledger date M/DD/YY (as parsed by xlsx) to YYYY/MM/DD
function normalizeLedgerDate(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3 && parts[2].length === 2) {
    const year = `20${parts[2]}`;
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
  return dateStr;
}

// xlsx misreads ANZ dates where day <= 12 as US-format MM/DD/YYYY serial numbers.
// This fixes those cells by swapping day and month back before parsing.
function fixAnzDateCells(sheet: xlsx.WorkSheet): void {
  const range = xlsx.utils.decode_range(sheet['!ref'] || 'A1');

  // Find the Date column index from the header row
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

export function labelAnzBankStatement({
  bankStatementPath,
  ledgerPath,
  outputPath,
}: {
  bankStatementPath: string;
  ledgerPath: string;
  outputPath: string;
}) {
  const bankStatement: xlsx.WorkBook = xlsx.readFile(bankStatementPath);
  const ledger: xlsx.WorkBook = xlsx.readFile(ledgerPath);

  const bankStatementSheet: xlsx.WorkSheet = bankStatement.Sheets[bankStatement.SheetNames[0]];
  const ledgerSheet: xlsx.WorkSheet = ledger.Sheets[ledger.SheetNames[0]];

  // Fix cells where xlsx misread DD/MM/YYYY dates as US-format serial numbers
  fixAnzDateCells(bankStatementSheet);

  // ANZ bank statement has no metadata rows — header is row 0
  const bankStatementData: Record<string, any>[] = xlsx.utils.sheet_to_json(bankStatementSheet, {
    raw: false,
  });
  const ledgerData: Record<string, any>[] = xlsx.utils.sheet_to_json(ledgerSheet, {
    raw: false,
  });

  const columnToCopy = 'Category';
  const bankTransfers = 'Transfers';

  if (![bankTransfers, columnToCopy].find((col: string) => ledgerData[1]?.hasOwnProperty(col))) {
    console.log('ledgerData[1]', ledgerData[1]);
    console.error(
      `Neither column "${columnToCopy}" nor "${bankTransfers}" was found in ledger sheet.`,
    );
    process.exit(1);
  }

  for (const row1 of bankStatementData) {
    const normalizedDate = normalizeBankDate(row1['Date']);

    const matchingRow = ledgerData.find(
      (row2) =>
        row2['Date'] &&
        normalizeLedgerDate(row2['Date']) === normalizedDate &&
        row2['Amount'].replace(/,/g, '') === row1['Amount'].replace(/,/g, ''),
    );

    row1[columnToCopy] = matchingRow ? matchingRow[columnToCopy] : '';
  }

  const newSheet: xlsx.WorkSheet = xlsx.utils.json_to_sheet(bankStatementData);
  bankStatement.Sheets[bankStatement.SheetNames[0]] = newSheet;

  createOutputDir(outputPath);
  xlsx.writeFile(bankStatement, outputPath);

  console.log(`Labelled file saved to ${outputPath}`);
}
