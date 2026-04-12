import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { normalizeDate, parseKiwibank } from './kiwibank-parser';

describe('normalizeDate', () => {
  it('converts YYYY-MM-DD to YYYY/MM/DD', () => {
    expect(normalizeDate('2026-04-09')).toBe('2026/04/09');
    expect(normalizeDate('2026-03-30')).toBe('2026/03/30');
    expect(normalizeDate('2026-01-01')).toBe('2026/01/01');
  });
});

describe('parseKiwibank', () => {
  const HEADER =
    'Account number,Effective Date,Transaction Date,Description,Transaction Code,Particulars,Code,Reference,Other Party Name,Other Party Account Number,Other Party Particulars,Other Party Code,Other Party Reference,Amount,Balance';

  const writeTempCsv = (content: string): string => {
    const filePath = path.join(os.tmpdir(), `kiwibank-test-${Date.now()}.csv`);
    fs.writeFileSync(filePath, content);
    return filePath;
  };

  it('normalises dates from YYYY-MM-DD to YYYY/MM/DD', () => {
    const csv = [
      HEADER,
      '00-0000-0000000-00,2026-04-09,2026-04-09,Mock description,EFTPOS,,,, Mock Store,,,,,- 10.00,100.00',
      '00-0000-0000000-00,2026-03-30,2026-03-30,Mock description,EFTPOS,,,,Mock Store,,,,,- 20.00,120.00',
    ].join('\n');

    const filePath = writeTempCsv(csv);
    const transactions = parseKiwibank(filePath);
    fs.unlinkSync(filePath);

    expect(transactions[0].Date).toBe('2026/04/09');
    expect(transactions[1].Date).toBe('2026/03/30');
  });

  it('uses Other Party Name as Payee when present', () => {
    const csv = [
      HEADER,
      '00-0000-0000000-00,2026-04-09,2026-04-09,Mock Direct Credit,DIRECT CREDIT,,,,Mock Employer,,,,,500.00,600.00',
    ].join('\n');

    const filePath = writeTempCsv(csv);
    const [tx] = parseKiwibank(filePath);
    fs.unlinkSync(filePath);

    expect(tx.Payee).toBe('Mock Employer');
  });

  it('falls back to Description as Payee when Other Party Name is empty', () => {
    const csv = [
      HEADER,
      '00-0000-0000000-00,2026-04-09,2026-04-09,Mock ATM Withdrawal,ATM,,,,,,,,,- 50.00,50.00',
    ].join('\n');

    const filePath = writeTempCsv(csv);
    const [tx] = parseKiwibank(filePath);
    fs.unlinkSync(filePath);

    expect(tx.Payee).toBe('Mock ATM Withdrawal');
  });

  it('handles quoted fields containing commas', () => {
    const csv = [
      HEADER,
      '00-0000-0000000-00,2026-04-09,2026-04-09,"Mock Transfer to A, B",DEBIT TRANSFER,,,,"Mock Person, A",00-0000-0000000-01,,,,- 100.00,0.00',
    ].join('\n');

    const filePath = writeTempCsv(csv);
    const [tx] = parseKiwibank(filePath);
    fs.unlinkSync(filePath);

    expect(tx.Payee).toBe('Mock Person, A');
    expect(tx.Memo).toContain('Mock Transfer to A, B');
  });

  it('maps all columns correctly', () => {
    const csv = [
      HEADER,
      '00-0000-0000000-00,2026-04-09,2026-04-09,Mock Grocery Shop,EFTPOS,Shop,Ref,001,Mock Store,,,,,- 30.00,70.00',
    ].join('\n');

    const filePath = writeTempCsv(csv);
    const [tx] = parseKiwibank(filePath);
    fs.unlinkSync(filePath);

    expect(tx['Tran Type']).toBe('EFTPOS');
    expect(tx.Memo).toBe('Mock Grocery Shop Shop Ref 001');
    expect(tx.Amount).toBe('- 30.00');
  });
});
