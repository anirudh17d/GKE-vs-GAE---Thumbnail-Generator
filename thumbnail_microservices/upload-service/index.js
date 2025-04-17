const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

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
  form.append('image', req.file.buffer, { filename: req.file.originalname });
  form.append('user', req.body.user || 'user');

  try {
    await axios.post(THUMBNAIL_SERVICE_URL, form, {
      headers: form.getHeaders(),
    });

    res.redirect('https://storage-service-dot-thumbnail-app-acs-2025.ey.r.appspot.com/images');
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).send('Image upload or processing failed.');
  }
});

app.listen(PORT, () => {
  console.log(`Upload service running on port ${PORT}`);
});
