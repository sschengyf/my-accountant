import { Command } from 'commander';
import { labelAsbBankStatement } from './asb-labeller';
import path from 'path';
import fs from 'fs';

const BANK_NAME_TO_LABELLER_MAP = {
  ASB: labelAsbBankStatement,
};

type BankName = keyof typeof BANK_NAME_TO_LABELLER_MAP;

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

const program = new Command();

program
  .name('label-bank-statement')
  .description('Label bank statements using existing ledger data')
  .version('1.0.0')
  .argument('<bank>', 'Bank name, e.g. ASB')
  .argument('<bank-statement>', 'Path to bank statement CSV file')
  .argument('<ledger>', 'Path to ledger CSV file')
  .option(
    '-o, --output <path>',
    'Output file path',
    'Combined-ASB-functor.xlsx'
  )
  .action((bank: BankName, bankStatementPath, ledgerPath, options) => {
    const { output } = options;
    const labeller = BANK_NAME_TO_LABELLER_MAP[bank.toUpperCase() as BankName];

    if (!labeller) {
      console.error(`Unsupported bank: ${bank}`);
      process.exit(1);
    }

    const resolvedBankStatement = resolveFilePath(bankStatementPath);
    const resolvedLedger = resolveFilePath(ledgerPath);
    const resolvedOutput = resolveOutputPath(output);

    labeller({
      bankStatementPath: resolvedBankStatement,
      ledgerPath: resolvedLedger,
      outputPath: resolvedOutput,
    });
  });

program.parse();
