import * as xlsx from 'xlsx';
import { ASBTransactionCategorized } from './types';

const CSV_SEP = ['sep=,'];
const CSV_COLS = [
  'Account',
  'Transfers',
  'Description',
  'Payee',
  'Category',
  'Date',
  'Time',
  'Amount',
  'Currency',
  'Probability',
];

const INIT_CSV_ROW = CSV_COLS.reduce((acc, key) => {
  acc[key] = '';
  return acc;
}, {});

const CSV_HEADER_ROW = [
  CSV_SEP, // Custom separator
  CSV_COLS, // Column headers
];

const DEFAULT_CSV_ROW = {
  ...INIT_CSV_ROW,
  Account: '',
  Time: '9:00 AM',
  Currency: 'NZD',
};

const MONEY_WIZ_CSV_AND_ASB_TRAN_MAPPING = {
  Payee: 'Payee',
  Category: 'Predicted Category',
  Date: 'Date',
  Amount: 'Amount',
  Probability: 'Probability',
};

export function generateMoneyWizCSV(data: ASBTransactionCategorized[]): string {
  const csvData = data.map((asbTranRow) => {
    const csvRow = { ...DEFAULT_CSV_ROW };
    Object.entries(MONEY_WIZ_CSV_AND_ASB_TRAN_MAPPING).forEach(
      ([csvKey, asbKey]) => {
        csvRow[csvKey] = asbTranRow[asbKey];
      }
    );
    return csvRow;
  });

  // Create a worksheet with sample data
  const worksheet = xlsx.utils.json_to_sheet(csvData);

  // Convert the worksheet to a CSV string
  const csv = xlsx.utils.sheet_to_csv(worksheet, {
    forceQuotes: true,
    FS: ',',
  });

  return csv;
}
