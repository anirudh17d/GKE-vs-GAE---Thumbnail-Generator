const express = require('express');
const multer = require('multer');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Static frontend
app.use(express.static('public'));

// Multer for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

// GCS config
const storage = new Storage({
  keyFilename: path.join(__dirname, 'thumbnail-app-acs-2025-3b06f94a8f55.json'), // Path to your service account key
});
const bucket = storage.bucket('thumbnail-uploads-acs'); 

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle file upload
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const fileBuffer = req.file.buffer;
  const originalName = req.file.originalname;
  const user = req.body.user || 'user';
  const baseFilename = `${user}_${uuidv4()}`;
  const sizes = [100, 300, 600];

  try {
    const thumbnails = [];

    for (const size of sizes) {
      const filename = `${baseFilename}_${size}.jpg`;
      const file = bucket.file(filename);

      await file.save(fileBuffer, {
        metadata: {
          contentType: req.file.mimetype,
        },
        public: true,
      });

      await file.makePublic();

      thumbnails.push({
        size,
        url: `https://storage.googleapis.com/${bucket.name}/${filename}`,
      });
    }

    // HTML response with nice layout
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Upload Success</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <div class="container">
          <h1>🎉 Upload Successful</h1>
          <p><strong>Original Name:</strong> ${originalName}</p>
          <div class="thumbnails">
            ${thumbnails
              .map(
                (thumb) => `
              <div class="thumbnail">
                <p>Size: ${thumb.size}px</p>
                <img src="${thumb.url}" alt="Thumbnail ${thumb.size}" />
              </div>
            `
              )
              .join('')}
          </div>
          <a href="/">← Back to Upload</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).send('Upload failed');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Storage service running on port ${PORT}`);
});
