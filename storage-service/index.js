import express from "express";
import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });
const bucket = storage.bucket(process.env.GCS_BUCKET);

app.post("/store", async (req, res) => {
  try {
    const buffer = Buffer.from(req.body.buffer, "base64");
    const filename = req.body.filename;

    const blob = bucket.file(filename);
    const stream = blob.createWriteStream({ resumable: false, contentType: "image/jpeg" });

    stream.on("error", (err) => res.status(500).send(err.message));
    stream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      res.json({ url: publicUrl });
    });

    stream.end(buffer);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(process.env.PORT || 3003, () => console.log("Storage Service running"));
