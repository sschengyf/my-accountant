import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseAsb } from '../parsers/asb-parser';

const ASB_CSV = [
  'Created date / time : 01 January 2026 / 00:00:00',
  'Bank 00; Branch 0000; Account 0000000-00 (Test Account)',
  'From date 20260323',
  'To date 20260409',
  'Avail Bal : 100.00 as of 20260408',
  'Ledger Balance : 100.00 as of 20260409',
  'Date,Unique Id,Tran Type,Cheque Number,Payee,Memo,Amount',
  '',
  '2026/03/23,0000000001,EFTPOS,,"Mock Store A","EFTPOS",-10.00',
  '2026/04/09,0000000002,D/D,,"Mock Store B","Monthly mock",-20.00',
].join('\n');

describe('parseAsb', () => {
  let filePath: string;

  beforeEach(() => {
    filePath = path.join(os.tmpdir(), `asb-test-${Date.now()}.csv`);
    fs.writeFileSync(filePath, ASB_CSV);
  });

  afterEach(() => {
    fs.unlinkSync(filePath);
  });

  it('skips metadata rows and parses data after Ledger Balance', () => {
    const transactions = parseAsb(filePath);
    expect(transactions).toHaveLength(2);
  });

  it('maps columns correctly', () => {
    const [tx] = parseAsb(filePath);
    expect(tx['Tran Type']).toBe('EFTPOS');
    expect(tx.Payee).toBe('Mock Store A');
    expect(tx.Memo).toBe('EFTPOS');
    expect(tx.Amount).toBe('-10.00');
  });

  it('produces dates in M/D/YY format', () => {
    const transactions = parseAsb(filePath);
    expect(transactions[0].Date).toBe('3/23/26');
    expect(transactions[1].Date).toBe('4/9/26');
  });
});
