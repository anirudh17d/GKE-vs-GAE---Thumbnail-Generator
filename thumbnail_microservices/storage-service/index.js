const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const vision = require('@google-cloud/vision');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.static('public'));
app.use(express.json({ limit: '10mb' }));

const upload = multer({ storage: multer.memoryStorage() });

const storage = new Storage({
  keyFilename: path.join(__dirname, 'thumbnail-app-acs-2025-3b06f94a8f55.json'),
});
const bucket = storage.bucket('thumbnail-uploads-acs');
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, 'thumbnail-app-acs-2025-3b06f94a8f55.json'),
});

// In-memory tag store
const tagsMap = {};
const colorMap = {
  person: '#e83e8c',
  people: '#e83e8c',
  dog: '#fd7e14',
  cat: '#6f42c1',
  food: '#ffc107',
  plant: '#28a745',
  animal: '#20c997',
  tree: '#198754',
  default: '#007bff',
};

// Upload
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  const user = req.body.user || 'user';
  const baseFilename = `${user}_${uuidv4()}`;
  const sizes = [100, 300, 600];

  try {
    const [result] = await visionClient.labelDetection(req.file.buffer);
    const labels = (result.labelAnnotations || []).map(l => l.description.toLowerCase()).slice(0, 5);

    for (const size of sizes) {
      const filename = `${baseFilename}_${size}.jpg`;
      const resizedImage = await sharp(req.file.buffer)
        .resize({ width: size })
        .jpeg()
        .toBuffer();

      const file = bucket.file(filename);
      await file.save(resizedImage, { metadata: { contentType: 'image/jpeg' } });

      tagsMap[filename] = labels;
    }

    res.redirect(`/images?user=${user}&upload=success`);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).send('Upload failed');
  }
});

// Store
app.post('/store', async (req, res) => {
  const { buffer, filename } = req.body;
  if (!buffer || !filename) return res.status(400).send('Missing buffer or filename');

  try {
    const file = bucket.file(filename);
    const imageBuffer = Buffer.from(buffer, 'base64');
    await file.save(imageBuffer, { metadata: { contentType: 'image/jpeg' } });
    res.status(200).send('Stored successfully');
  } catch (err) {
    console.error('Storage error:', err);
    res.status(500).send('Failed to store image');
  }
});

// Delete
app.post('/delete', express.json(), async (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).send('Missing filename');
  try {
    await bucket.file(filename).delete();
    delete tagsMap[filename];
    res.status(200).send('Deleted');
  } catch (err) {
    res.status(500).send(`Delete failed: ${err.message}`);
  }
});

// Gallery
app.get('/images', async (req, res) => {
  const pageSize = 6;
  const page = parseInt(req.query.page) || 1;
  const userFilter = req.query.user;
  const tagFilter = req.query.tag?.toLowerCase();
  const searchQuery = req.query.search?.toLowerCase() || '';
  const showUploadToast = req.query.upload === 'success';

  try {
    const [rawFiles] = await bucket.getFiles();
    const files = await Promise.all(
      rawFiles.map(async file => {
        const [metadata] = await file.getMetadata();
        return {
          name: file.name,
          updated: new Date(metadata.updated),
          url: `https://storage.googleapis.com/${bucket.name}/${file.name}`,
          user: file.name.split('_')[0] || 'Unknown',
          tags: tagsMap[file.name] || [],
        };
      })
    );

    let fileLinks = files
      .filter(f => !userFilter || f.user === userFilter)
      .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery))
      .filter(f => !tagFilter || f.tags.includes(tagFilter))
      .sort((a, b) => b.updated - a.updated);

    const totalPages = Math.ceil(fileLinks.length / pageSize);
    const paginated = fileLinks.slice((page - 1) * pageSize, page * pageSize);
    const baseUrl = `/images?${userFilter ? `user=${userFilter}&` : ''}${searchQuery ? `search=${searchQuery}&` : ''}${tagFilter ? `tag=${tagFilter}&` : ''}`;

    // Collect all tags for dropdown
    const allTags = [...new Set(files.flatMap(f => f.tags))].sort();

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Image Gallery</title>
        <link rel="stylesheet" href="/styles.css" />
        <script>
          let fileToDelete = '';
          function confirmDelete(filename) {
            fileToDelete = filename;
            document.getElementById('modal').style.display = 'block';
          }
          function cancelDelete() {
            fileToDelete = '';
            document.getElementById('modal').style.display = 'none';
          }
          function performDelete() {
            fetch('/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: fileToDelete })
            })
            .then(async res => {
              document.getElementById('modal').style.display = 'none';
              if (!res.ok) {
                const err = await res.text();
                showToast('❌ ' + err, false);
                return;
              }
              showToast('✅ Image deleted');
              setTimeout(() => location.reload(), 1000);
            })
            .catch(err => showToast('❌ Network error', false));
          }
          function showToast(message, success = true) {
            const toast = document.getElementById('toast');
            toast.innerText = message;
            toast.style.background = success ? '#28a745' : '#dc3545';
            toast.classList.add('show');
            toast.style.display = 'block';
            setTimeout(() => {
              toast.classList.remove('show');
              setTimeout(() => toast.style.display = 'none', 300);
            }, 3000);
          }
          window.onload = function() {
            ${showUploadToast ? `showToast("✅ Upload successful");` : ''}
          }
        </script>
      </head>
      <body>
        <div class="container">
          <a href="/" class="top-link">← Back to Upload</a>
          <h1>🖼️ Stored Images</h1>

          <form method="GET" action="/images" style="margin-bottom: 1rem;">
            ${userFilter ? `<input type="hidden" name="user" value="${userFilter}">` : ''}
            <input type="text" name="search" value="${searchQuery}" placeholder="Search filenames..." style="padding: 0.5rem; width: 40%; border-radius: 6px; border: 1px solid #ccc;" />
            <select name="tag" onchange="this.form.submit()" style="padding: 0.5rem;">
              <option value="">🔎 Filter by tag</option>
              ${allTags.map(tag => `<option value="${tag}" ${tag === tagFilter ? 'selected' : ''}>${tag}</option>`).join('')}
            </select>
            <button type="submit" style="padding: 0.5rem 1rem; border-radius: 6px;">Search</button>
          </form>

          <div class="thumbnails">
            ${paginated.map(f => `
              <div class="thumbnail hover-preview">
                <p><strong>User:</strong> ${f.user}</p>
                <p><strong>Filename:</strong> ${f.name}</p>
                <img src="${f.url}" alt="${f.name}" />
                <div><strong>Tags:</strong> ${
                  f.tags.map(tag => `<span class="tag-badge" style="background:${colorMap[tag] || colorMap.default}">${tag}</span>`).join('')
                }</div>
                <button onclick="confirmDelete('${f.name}')">Delete</button>
              </div>
            `).join('')}
          </div>

          <div class="pagination">
            ${page > 1 ? `<a href="${baseUrl}page=${page - 1}">Previous</a>` : ''}
            ${page < totalPages ? `<a href="${baseUrl}page=${page + 1}">Next</a>` : ''}
          </div>

          <div id="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5);">
            <div style="background:white; width:300px; margin:100px auto; padding:20px; border-radius:10px; text-align:center;">
              <p>Are you sure you want to delete this image?</p>
              <button onclick="performDelete()" style="background:#dc3545; color:white; padding:0.5rem 1rem; margin-right:10px;">Yes, Delete</button>
              <button onclick="cancelDelete()" style="padding:0.5rem 1rem;">Cancel</button>
            </div>
          </div>

          <div id="toast" style="display:none; position:fixed; bottom:20px; right:20px; background:#333; color:#fff; padding:12px 20px; border-radius:8px; font-size:14px; z-index:9999;"></div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Could not list images');
  }
});

app.listen(PORT, () => {
  console.log(`Storage service running on port ${PORT}`);
});
