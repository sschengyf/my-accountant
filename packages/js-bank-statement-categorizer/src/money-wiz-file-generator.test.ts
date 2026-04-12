import { formatDate, generateMoneyWizCSV } from './money-wiz-file-generator';
import { TransactionCategorized } from './types';

describe('formatDate', () => {
  it('converts YYYY/MM/DD to M/D/YY', () => {
    expect(formatDate('2026/04/09')).toBe('4/9/26');
    expect(formatDate('2026/03/30')).toBe('3/30/26');
    expect(formatDate('2026/12/01')).toBe('12/1/26');
  });

  it('strips leading zeros from month and day', () => {
    expect(formatDate('2026/01/07')).toBe('1/7/26');
  });

  it('passes through strings that are not YYYY/MM/DD', () => {
    expect(formatDate('09/04/2026')).toBe('09/04/2026');
    expect(formatDate('invalid')).toBe('invalid');
  });
});

describe('generateMoneyWizCSV', () => {
  const makeTransaction = (date: string): TransactionCategorized => ({
    Date: date,
    'Tran Type': 'EFTPOS',
    Payee: 'Some Shop',
    Memo: '',
    Amount: '-10.00',
    'Predicted Category': 'Food & Dining > Groceries',
    Probability: 0.9,
  });

  it('formats all dates consistently as M/D/YY regardless of day value', () => {
    // The original bug: dates with day > 12 (e.g. 30th) were not auto-detected
    // by xlsx and came out as YYYY/MM/DD, while others came out as M/D/YY
    const transactions = [
      makeTransaction('2026/04/09'), // day <= 12, was auto-detected
      makeTransaction('2026/03/30'), // day > 12, was NOT auto-detected
    ];

    const csv = generateMoneyWizCSV(transactions, 'ANZ go');
    const rows = csv.split('\n');
    const dataRows = rows.filter((r) => r.includes('ANZ go'));

    expect(dataRows[0]).toContain('"4/9/26"');
    expect(dataRows[1]).toContain('"3/30/26"');
  });
});
