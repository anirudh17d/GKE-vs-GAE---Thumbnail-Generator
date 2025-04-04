import express from "express";
import sharp from "sharp";
import { v4 as uuid } from "uuid";
import axios from "axios";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
dotenv.config();

const app = express();
app.use(fileUpload());

app.post("/process", async (req, res) => {
  try {
    const file = req.files.image;
    const userId = req.body.user;
    const originalId = uuid();
    const sizes = [100, 300, 600];
    const results = [];

    for (const size of sizes) {
      const filename = `${originalId}_${size}.jpg`;
      const buffer = await sharp(file.data).resize(size).toBuffer();

      const response = await axios.post(
        process.env.STORAGE_SERVICE_URL,
        { buffer: buffer.toString("base64"), filename },
        { headers: { "Content-Type": "application/json" } }
      );

      results.push({ size, url: response.data.url });
    }

    res.json({ originalName: file.name, thumbnails: results });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(process.env.PORT || 3002, () => console.log("Thumbnail Service running"));
