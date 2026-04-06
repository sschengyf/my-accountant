import { normalizeDate } from './asb-labeller';

describe('normalizeDate', () => {
  it('converts M/D/YY to YYYY/MM/DD', () => {
    expect(normalizeDate('10/5/23')).toBe('2023/10/05');
  });

  it('converts M/DD/YY to YYYY/MM/DD', () => {
    expect(normalizeDate('10/19/23')).toBe('2023/10/19');
  });

  it('pads single-digit month and day', () => {
    expect(normalizeDate('1/3/26')).toBe('2026/01/03');
  });

  it('returns the string unchanged if not in M/D/YY format', () => {
    expect(normalizeDate('2023/10/05')).toBe('2023/10/05');
  });
});
