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

// Multer for in-memory upload
const upload = multer({ storage: multer.memoryStorage() });

// Target URL of the thumbnail service
const THUMBNAIL_SERVICE_URL = 'https://thumbnail-service-dot-thumbnail-app-acs-2025.ey.r.appspot.com/process';

// Serve static frontend
app.use(express.static('public'));

// Upload form (GET)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload handler (POST)
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');

  const form = new FormData();
  form.append('image', req.file.buffer, req.file.originalname);
  form.append('user', req.body.user || 'user');

  try {
    await axios.post(THUMBNAIL_SERVICE_URL, form, {
      headers: form.getHeaders(),
    });

    const baseFilename = `${req.body.user}_${Date.now()}`;
    const resultData = {
      originalName: req.file.originalname,
      thumbnails: [100, 300, 600].map(size => ({
        size,
        url: `https://storage.googleapis.com/thumbnail-uploads-acs/${baseFilename}_${size}.jpg`,
      })),
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
    console.error('Upload failed:', err.message);
    res.status(500).send('Image upload or processing failed.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Upload service running on port ${PORT}`);
});
