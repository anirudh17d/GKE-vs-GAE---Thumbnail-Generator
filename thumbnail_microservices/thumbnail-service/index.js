import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/process', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const sizes = [100, 300, 600];
  const user = req.body.user || 'user';
  const baseFilename = `${user}_${Date.now()}`;

  try {
    const results = [];

    for (const size of sizes) {
      const resizedBuffer = await sharp(req.file.buffer)
        .resize({ width: size })
        .jpeg()
        .toBuffer();

      results.push({
        size,
        buffer: resizedBuffer.toString('base64'),
        filename: `${baseFilename}_${size}.jpg`,
        user
      });
    }

    res.status(200).json({ base: baseFilename, thumbnails: results });
  } catch (err) {
    console.error('Thumbnail generation failed:', err);
    res.status(500).send('Thumbnail generation failed');
  }
});

app.listen(PORT, () => {
  console.log(`Thumbnail service running on port ${PORT}`);
});