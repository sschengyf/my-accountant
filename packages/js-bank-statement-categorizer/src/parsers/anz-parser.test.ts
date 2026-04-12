import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { normalizeDate, parseAnz } from './anz-parser';

describe('normalizeDate', () => {
  it('converts DD/MM/YYYY to YYYY/MM/DD', () => {
    expect(normalizeDate('09/04/2026')).toBe('2026/04/09');
    expect(normalizeDate('30/03/2026')).toBe('2026/03/30');
    expect(normalizeDate('01/01/2026')).toBe('2026/01/01');
  });

  it('passes through strings that are not DD/MM/YYYY', () => {
    expect(normalizeDate('2026/04/09')).toBe('2026/04/09');
    expect(normalizeDate('invalid')).toBe('invalid');
  });
});

describe('parseAnz', () => {
  const writeTempCsv = (content: string): string => {
    const filePath = path.join(os.tmpdir(), `anz-test-${Date.now()}.csv`);
    fs.writeFileSync(filePath, content);
    return filePath;
  };

  it('correctly parses dates where day <= 12 without xlsx misdetection', () => {
    // 09/04/2026 and 07/04/2026: day values 9 and 7 are <= 12, which caused
    // xlsx to misdetect them as M/D/YYYY (September 4, July 4) when reading via xlsx
    const csv = [
      'Type,Details,Particulars,Code,Reference,Amount,Date,ForeignCurrencyAmount,ConversionCharge',
      'Eft-Pos,Mock Store A,4835,,ref,-10.00,09/04/2026,,',
      'Eft-Pos,Mock Store B,4835,,ref,-20.00,30/03/2026,,',
    ].join('\n');

    const filePath = writeTempCsv(csv);
    const transactions = parseAnz(filePath);
    fs.unlinkSync(filePath);

    expect(transactions[0].Date).toBe('2026/04/09');
    expect(transactions[1].Date).toBe('2026/03/30');
  });

  it('maps columns correctly', () => {
    const csv = [
      'Type,Details,Particulars,Code,Reference,Amount,Date,ForeignCurrencyAmount,ConversionCharge',
      'Eft-Pos,Mock Store,Particulars,Code,Ref123,-10.00,09/04/2026,,',
    ].join('\n');

    const filePath = writeTempCsv(csv);
    const [tx] = parseAnz(filePath);
    fs.unlinkSync(filePath);

    expect(tx['Tran Type']).toBe('Eft-Pos');
    expect(tx.Payee).toBe('Mock Store');
    expect(tx.Memo).toBe('Particulars Code Ref123');
    expect(tx.Amount).toBe('-10.00');
  });
});
