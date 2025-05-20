import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

function createOutputDir(outputPath: string): void {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

export function labelAsbBankStatement({
  bankStatementPath,
  ledgerPath,
  outputPath,
}: {
  bankStatementPath: string;
  ledgerPath: string;
  outputPath: string;
}) {
  // Load the two workbooks using proper path joining
  const bankStatement: xlsx.WorkBook = xlsx.readFile(bankStatementPath);
  const ledger: xlsx.WorkBook = xlsx.readFile(ledgerPath);

  // Get the first worksheet from each workbook
  const bankStatementSheet: xlsx.WorkSheet = bankStatement.Sheets[bankStatement.SheetNames[0]];
  const ledgerSheet: xlsx.WorkSheet = ledger.Sheets[ledger.SheetNames[0]];

  // Convert the sheets to JSON
  const bankStatementData: Record<string, any>[] = xlsx.utils.sheet_to_json(bankStatementSheet, {
    range: 5,
    header: 5,
    raw: false,
  });
  const ledgerData: Record<string, any>[] = xlsx.utils.sheet_to_json(ledgerSheet, {
    raw: false,
  });

  // Assuming we want to copy a column "ColumnToCopy" from bank statement sheet to ledger sheet
  const columnToCopy = 'Category';
  const bankTransfers = 'Transfers';

  //Check if the column exists in the ledger sheet
  if (![bankTransfers, columnToCopy].find((col: string) => ledgerData[1]?.hasOwnProperty(col))) {
    console.log('ledgerData[1]', ledgerData[1]);
    console.error(
      `Neither column "${columnToCopy}" nor "${bankTransfers}" was found in ledger sheet.`,
    );
    process.exit(1);
  }

  for (const row1 of bankStatementData) {
    // Find matching row in ledgerData
    const matchingRow = ledgerData.find(
      (row2) =>
        row2['Date'] === row1['Date'] &&
        row2['Amount'].replace(/,/g, '') === row1['Amount'].replace(/,/g, ''),
    );

    // Copy category if match found
    row1[columnToCopy] = matchingRow ? matchingRow[columnToCopy] : '';
  }

  // Convert JSON back to a worksheet
  const newSheet: xlsx.WorkSheet = xlsx.utils.json_to_sheet(bankStatementData);

  // Update the second workbook
  bankStatement.Sheets[bankStatement.SheetNames[0]] = newSheet;

  // Write the updated workbook to a new file in the output directory
  createOutputDir(outputPath);
  xlsx.writeFile(bankStatement, outputPath);

  console.log(`Labelled file saved to ${outputPath}`);
}
