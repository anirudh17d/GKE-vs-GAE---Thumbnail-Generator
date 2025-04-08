import express from "express";
import sharp from "sharp";
import { v4 as uuid } from "uuid";
import axios from "axios";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
dotenv.config();

const app = express();
app.use(fileUpload());

app.get("/", (req, res) => {
  res.send("🖼️ Thumbnail Service is live");
});

app.post("/process", async (req, res) => {
  try {
    const file = req.files.image;
    const userId = req.body.user;
    const originalId = uuid();
    const sizes = [100, 300, 600];
    const results = [];

    for (const size of sizes) {
      const filename = `${userId}_${originalId}_${size}.jpg`;
      const buffer = await sharp(file.data).resize(size).toBuffer();

      const response = await axios.post(
        process.env.STORAGE_SERVICE_URL,
        {
          buffer: buffer.toString("base64"),
          filename,
          user: userId
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );

      results.push({ size, url: response.data.url });
    }

    res.json({ originalName: file.name, thumbnails: results });
  } catch (err) {
    console.error("Thumbnail generation failed:", err);
    res.status(500).send("Thumbnail generation failed");
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log("Thumbnail Service running on port " + port);
});