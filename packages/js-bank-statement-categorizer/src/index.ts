import express, { Request, Response, RequestHandler } from 'express';
import multer from 'multer';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import cors from 'cors';
import { categorizeStatementData } from './categorizer';
import { generateMoneyWizCSV } from './money-wiz-file-generator';
import { ASBTransaction } from './types';

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.post('/upload', upload.single('file'), (async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    const filePath = path.join('uploads', req.file.filename);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];

    const allData: any[] = xlsx.utils.sheet_to_json(
      workbook.Sheets[sheetName],
      {
        header: 1,
      }
    );

    const ledgerBalanceRowNum = allData.findIndex((row) => {
      return (
        row[0] &&
        typeof row[0] === 'string' &&
        row[0].includes('Ledger Balance')
      );
    });

    if (ledgerBalanceRowNum !== -1) {
      console.log(
        `The row number of "Ledger Balance" is: ${ledgerBalanceRowNum}`
      );
    } else {
      console.log('Ledger Balance row not found');
    }

    const startRowNum = ledgerBalanceRowNum + 1; // Skip the header rows

    const data = xlsx.utils.sheet_to_json<ASBTransaction>(
      workbook.Sheets[sheetName],
      {
        range: startRowNum,
        header: startRowNum,
        raw: false,
      }
    );

    fs.unlinkSync(filePath); // Remove uploaded file after processing

    const categorizedData = await categorizeStatementData(data);
    const csv = generateMoneyWizCSV(categorizedData);

    // Set response headers for CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="money-wiz.csv"'
    );

    // Send the CSV string as the response
    res.send(csv);
    return;
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Internal server error.' });
    return;
  }
}) as RequestHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
