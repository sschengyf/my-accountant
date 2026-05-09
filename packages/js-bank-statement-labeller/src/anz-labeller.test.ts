import * as xlsx from 'xlsx';
import { normalizeBankDate, fixAnzDateCells, parseAnzRow } from './anz-labeller';

describe('normalizeBankDate', () => {
  it('converts DD/MM/YYYY to YYYY/MM/DD', () => {
    expect(normalizeBankDate('30/03/2026')).toBe('2026/03/30');
  });

  it('converts single-digit day and month', () => {
    expect(normalizeBankDate('09/03/2026')).toBe('2026/03/09');
  });

  it('returns the string unchanged if not in DD/MM/YYYY format', () => {
    expect(normalizeBankDate('2026/03/30')).toBe('2026/03/30');
  });
});

describe('fixAnzDateCells', () => {
  function makeSheet(dates: string[]): xlsx.WorkSheet {
    const data = [['Date'], ...dates.map((d) => [d])];
    return xlsx.utils.aoa_to_sheet(data);
  }

  it('leaves unambiguous dates (day > 12) as strings', () => {
    const sheet = makeSheet(['30/03/2026', '25/03/2026']);
    fixAnzDateCells(sheet);
    const rows = xlsx.utils.sheet_to_json<{ Date: string }>(sheet);
    expect(rows[0].Date).toBe('30/03/2026');
    expect(rows[1].Date).toBe('25/03/2026');
  });

  it('fixes dates where day <= 12 that xlsx misreads as MM/DD/YYYY', () => {
    // xlsx will interpret 09/03/2026 as September 3rd (US format)
    const sheet = makeSheet(['09/03/2026', '11/03/2026', '12/03/2026']);
    fixAnzDateCells(sheet);
    const rows = xlsx.utils.sheet_to_json<{ Date: string }>(sheet);
    expect(rows[0].Date).toBe('09/03/2026');
    expect(rows[1].Date).toBe('11/03/2026');
    expect(rows[2].Date).toBe('12/03/2026');
  });

  it('does nothing if there is no Date column', () => {
    const sheet = xlsx.utils.aoa_to_sheet([['Amount'], ['100']]);
    expect(() => fixAnzDateCells(sheet)).not.toThrow();
  });
});

describe('parseAnzRow', () => {
  it('uses Details as payee for Eft-Pos', () => {
    const row = parseAnzRow({ Type: 'Eft-Pos', Details: 'Mock Store', Particulars: 'P', Code: 'C', Reference: 'R', Date: '04/05/2026', Amount: '-10.00' });
    expect(row.Payee).toBe('Mock Store');
    expect(row.Memo).toBe('P C R');
    expect(row['Tran Type']).toBe('Eft-Pos');
  });

  it.each(['Visa Purchase', 'Visa Refund'])('uses Code as payee for %s', (type) => {
    const row = parseAnzRow({ Type: type, Details: '4835-****-****-0442  Df', Code: 'Greens', Reference: '', Date: '01/05/2026', Amount: '-25.49' });
    expect(row.Payee).toBe('Greens');
    expect(row.Memo).toBe('4835-****-****-0442  Df');
  });
});
