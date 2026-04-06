import { normalizeLedgerDate } from './utils';

describe('normalizeLedgerDate', () => {
  it('converts M/DD/YY to YYYY/MM/DD', () => {
    expect(normalizeLedgerDate('3/22/26')).toBe('2026/03/22');
  });

  it('converts M/D/YY to YYYY/MM/DD', () => {
    expect(normalizeLedgerDate('3/9/26')).toBe('2026/03/09');
  });

  it('pads single-digit month and day', () => {
    expect(normalizeLedgerDate('1/5/26')).toBe('2026/01/05');
  });

  it('returns the string unchanged if already in YYYY/MM/DD format', () => {
    expect(normalizeLedgerDate('2026/03/22')).toBe('2026/03/22');
  });
});
