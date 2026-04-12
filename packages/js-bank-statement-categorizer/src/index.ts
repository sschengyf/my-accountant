import express, { Request, Response, RequestHandler } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import cors from 'cors';
import { categorizeStatementData } from './categorizer';
import { generateMoneyWizCSV } from './money-wiz-file-generator';
import { parseAsb } from './parsers/asb-parser';
import { parseAnz } from './parsers/anz-parser';
import { parseKiwibank } from './parsers/kiwibank-parser';

const BANK_PARSERS: Record<string, (filePath: string) => any[]> = {
  asb: parseAsb,
  anz: parseAnz,
  kiwibank: parseKiwibank,
};

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.post('/upload', upload.single('file'), (async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    const bank = ((req.query.bank as string) || 'asb').toLowerCase();
    const account = (req.query.account as string) ?? '';

    const parser = BANK_PARSERS[bank];
    if (!parser) {
      res.status(400).json({ error: `Unsupported bank: ${bank}` });
      return;
    }

    const filePath = path.join('uploads', req.file.filename);
    const data = parser(filePath);

    fs.unlinkSync(filePath);

    const categorizedData = await categorizeStatementData(data, bank);
    const csv = generateMoneyWizCSV(categorizedData, account);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="money-wiz.csv"');
    res.send(csv);
    return;
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Internal server error.' });
    return;
  }
}) as RequestHandler);

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
