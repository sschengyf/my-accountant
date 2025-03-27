import express, { Request, Response, RequestHandler } from 'express';
import multer from 'multer';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import cors from 'cors';
import { categorizeStatementData } from './categorizer';

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
    const data: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      range: 5,
      header: 5,
      raw: false,
    });

    fs.unlinkSync(filePath); // Remove uploaded file after processing

    const responseData = await categorizeStatementData(data);

    res.json(responseData);
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
