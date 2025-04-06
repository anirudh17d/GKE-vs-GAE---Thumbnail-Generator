import express from "express";
import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
const bucket = storage.bucket(process.env.GCS_BUCKET);

app.get("/", (req, res) => {
  res.send("📦 Storage Service is live");
});

app.post("/store", async (req, res) => {
  try {
    const { buffer, filename } = req.body;
    if (!buffer || !filename) {
      return res.status(400).send("Missing buffer or filename");
    }

    const imageBuffer = Buffer.from(buffer, "base64");
    const blob = bucket.file(filename);

    const stream = blob.createWriteStream({
      resumable: false,
      contentType: "image/jpeg",
    });

    stream.on("error", (err) => {
      console.error("Upload error:", err);
      res.status(500).send("Error uploading to GCS");
    });

    stream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      res.json({ url: publicUrl });
    });

    stream.end(imageBuffer);
  } catch (err) {
    console.error("Storage service error:", err);
    res.status(500).send("Storage service failed");
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log("Storage Service running on port " + port);
});
