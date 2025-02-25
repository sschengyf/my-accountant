import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

// Parse command line arguments
interface CommandLineArgs {
  bankStatementPath: string;
  ledgerPath: string;
  outputPath: string;
}

function resolveFilePath(filePath: string): string {
  // If it's an absolute path, use it directly
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  // Try different relative paths
  const possiblePaths = [
    // Relative to current working directory
    path.resolve(process.cwd(), filePath),
    // Relative to script location
    path.resolve(__dirname, filePath),
    // Relative to script location, one level up (src/../)
    path.resolve(__dirname, '..', filePath),
  ];

  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }

  console.error(`Could not find file: ${filePath}`);
  console.error('Tried the following locations:');
  possiblePaths.forEach((p) => console.error(`- ${p}`));
  process.exit(1);
}

function resolveOutputPath(outputPath: string): string {
  if (path.isAbsolute(outputPath)) {
    return outputPath;
  }
  return path.resolve(process.cwd(), outputPath);
}

function createOutputDir(outputPath: string): void {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

function parseArgs(): CommandLineArgs {
  const args = process.argv.slice(2); // Remove first two default args

  if (args.length < 3) {
    console.error(
      'Usage: ts-node asb-labeller.ts <bank-statement.xlsx> <ledger.xlsx> [output.xlsx]'
    );
    process.exit(1);
  }

  return {
    bankStatementPath: resolveFilePath(args[0]),
    ledgerPath: resolveFilePath(args[1]),
    outputPath: resolveOutputPath(args[2]),
  };
}

function main() {
  const { bankStatementPath, ledgerPath, outputPath } = parseArgs();

  // Load the two workbooks using proper path joining
  const bankStatement: xlsx.WorkBook = xlsx.readFile(bankStatementPath);
  const ledger: xlsx.WorkBook = xlsx.readFile(ledgerPath);

  // Get the first worksheet from each workbook
  const bankStatementSheet: xlsx.WorkSheet =
    bankStatement.Sheets[bankStatement.SheetNames[0]];
  const ledgerSheet: xlsx.WorkSheet = ledger.Sheets[ledger.SheetNames[0]];

  // Convert the sheets to JSON
  const bankStatementData: Record<string, any>[] = xlsx.utils.sheet_to_json(
    bankStatementSheet,
    {
      range: 5,
      header: 5,
      raw: false,
    }
  );
  const ledgerData: Record<string, any>[] = xlsx.utils.sheet_to_json(
    ledgerSheet,
    {
      raw: false,
    }
  );

  // Assuming we want to copy a column "ColumnToCopy" from spreadbankStatementSheet to spreadledgerSheet
  const columnToCopy: string = 'Category';

  //Check if the column exists in the first sheet
  if (!ledgerData[1]?.hasOwnProperty(columnToCopy)) {
    console.error(`Column "${columnToCopy}" not found in spreadledgerSheet.`);
    process.exit(1);
  }

  for (const row1 of bankStatementData) {
    // Find matching row in ledgerData
    const matchingRow = ledgerData.find(
      (row2) =>
        row2['Date'] === row1['Date'] && row2['Amount'] === row1['Amount']
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

main();
