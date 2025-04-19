import express from 'express';
import multer from 'multer';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const upload = multer({ storage: multer.memoryStorage() });

const THUMBNAIL_SERVICE_URL = 'https://thumbnail-service-dot-thumbnail-app-acs-2025.ey.r.appspot.com/process';

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');

  const form = new FormData();
  form.append('image', req.file.buffer, req.file.originalname);
  form.append('user', req.body.user || 'user');

  try {
    const response = await axios.post(THUMBNAIL_SERVICE_URL, form, {
      headers: form.getHeaders()
    });

    const { thumbnails, base } = response.data;

    const resultData = {
      originalName: req.file.originalname,
      base,
      thumbnails
    };

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecting...</title>
        <script>
          localStorage.setItem("uploadResult", '${JSON.stringify(resultData)}');
          window.location.href = "/result.html";
        </script>
      </head>
      <body>
        Redirecting to result page...
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).send('Image upload or processing failed.');
  }
});

app.listen(PORT, () => {
  console.log(`Upload service running on port ${PORT}`);
});