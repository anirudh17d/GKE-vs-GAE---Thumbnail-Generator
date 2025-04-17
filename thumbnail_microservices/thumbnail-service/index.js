const express = require('express');
const multer = require('multer');
const axios = require('axios');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const upload = multer({ storage: multer.memoryStorage() });

const STORAGE_SERVICE_URL = 'https://storage-service-dot-thumbnail-app-acs-2025.ey.r.appspot.com/store';

app.get('/', (req, res) => {
  res.send('<h1>Thumbnail Service</h1><p>POST an image to /process</p>');
});

app.post('/process', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const sizes = [100, 300, 600];
  const user = req.body.user || 'user';
  const baseFilename = `${user}_${uuidv4()}`;

  try {
    for (const size of sizes) {
      const resizedBuffer = await sharp(req.file.buffer)
        .resize({ width: size })
        .jpeg()
        .toBuffer();

      const filename = `${baseFilename}_${size}.jpg`;

      await axios.post(STORAGE_SERVICE_URL, {
        buffer: resizedBuffer.toString('base64'),
        filename,
        user,
      });
    }

    res.redirect('https://storage-service-dot-thumbnail-app-acs-2025.ey.r.appspot.com/images');
  } catch (err) {
    console.error('Thumbnail generation failed:', err.message);
    res.status(500).send('Thumbnail generation failed');
  }
});

app.listen(PORT, () => {
  console.log(`Thumbnail service running on port ${PORT}`);
});
