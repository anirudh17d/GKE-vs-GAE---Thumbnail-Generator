const express = require('express');
const multer = require('multer');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Static frontend
app.use(express.static('public'));

// Middleware
app.use(express.json({ limit: '10mb' })); // Needed for /store

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

// GCS setup
const storage = new Storage({
  keyFilename: path.join(__dirname, 'thumbnail-app-acs-2025-3b06f94a8f55.json'),
});
const bucket = storage.bucket('thumbnail-uploads-acs');

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST /upload — Image upload + resize
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const originalName = req.file.originalname;
  const user = req.body.user || 'user';
  const baseFilename = `${user}_${uuidv4()}`;
  const sizes = [100, 300, 600];

  try {
    const thumbnails = [];

    for (const size of sizes) {
      const filename = `${baseFilename}_${size}.jpg`;
      const resizedImage = await sharp(req.file.buffer)
        .resize({ width: size })
        .jpeg()
        .toBuffer();

      const file = bucket.file(filename);
      await file.save(resizedImage, {
        metadata: { contentType: 'image/jpeg' },
      });

      thumbnails.push({
        size,
        url: `https://storage.googleapis.com/${bucket.name}/${filename}`,
        filename,
      });
    }

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
            ${thumbnails.map(thumb => `
              <div class="thumbnail">
                <p>Size: ${thumb.size}px</p>
                <img src="${thumb.url}" alt="Thumbnail ${thumb.size}" />
              </div>`).join('')}
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

// POST /store — Direct thumbnail storage from thumbnail-service
app.post('/store', async (req, res) => {
  const { buffer, filename, user } = req.body;

  if (!buffer || !filename) {
    return res.status(400).send('Missing buffer or filename');
  }

  try {
    const file = bucket.file(filename);
    const imageBuffer = Buffer.from(buffer, 'base64');

    await file.save(imageBuffer, {
      metadata: { contentType: 'image/jpeg' },
    });

    res.status(200).send('Stored successfully');
  } catch (err) {
    console.error('Storage error:', err);
    res.status(500).send('Failed to store image');
  }
});

// GET /images — View uploaded images
app.get('/images', async (req, res) => {
  try {
    const [files] = await bucket.getFiles();
    const fileLinks = files.map(file => ({
      name: file.name,
      url: `https://storage.googleapis.com/${bucket.name}/${file.name}`,
    }));

    if (req.query.format === 'json') {
      res.json(fileLinks);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Image Gallery</title>
          <link rel="stylesheet" href="/styles.css" />
        </head>
        <body>
          <div class="container">
            <h1>🖼️ Stored Images</h1>
            <div class="thumbnails">
              ${fileLinks.map(f => `
                <div class="thumbnail">
                  <p>${f.name}</p>
                  <img src="${f.url}" alt="${f.name}" />
                </div>`).join('')}
            </div>
            <a href="/">← Back to Upload</a>
          </div>
        </body>
        </html>
      `);
    }
  } catch (err) {
    console.error('Error listing images:', err);
    res.status(500).send('Could not list images');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Storage service running on port ${PORT}`);
});
