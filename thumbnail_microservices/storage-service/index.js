import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

// Simple in-memory mock storage (doesn't persist between restarts)
const mockStorage = {};

app.post("/store", async (req, res) => {
  try {
    const buffer = Buffer.from(req.body.buffer, "base64");
    const filename = req.body.filename;

    // Store buffer in memory (mock)
    mockStorage[filename] = buffer;
    console.log(`[MOCK STORAGE] Stored file: ${filename} (${buffer.length} bytes)`);

    // Simulate a public URL
    const mockUrl = `http://localhost:${process.env.PORT || 3003}/mock-storage/${filename}`;
    res.json({ url: mockUrl });
  } catch (err) {
    console.error(err);
    res.status(500).send("Mock storage failed");
  }
});

// Optional: endpoint to retrieve mock files
app.get("/mock-storage/:filename", (req, res) => {
  const { filename } = req.params;
  const file = mockStorage[filename];
  if (!file) {
    return res.status(404).send("File not found");
  }

  res.set("Content-Type", "image/jpeg");
  res.send(file);
});

app.listen(process.env.PORT || 3003, () =>
  console.log("Storage Service running in mock mode")
);













// import express from "express";
// import { Storage } from "@google-cloud/storage";
// import dotenv from "dotenv";
// dotenv.config();

// const app = express();
// app.use(express.json({ limit: "10mb" }));

// const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });
// const bucket = storage.bucket(process.env.GCS_BUCKET);

// app.post("/store", async (req, res) => {
//   try {
//     const buffer = Buffer.from(req.body.buffer, "base64");
//     const filename = req.body.filename;

//     const blob = bucket.file(filename);
//     const stream = blob.createWriteStream({ resumable: false, contentType: "image/jpeg" });

//     stream.on("error", (err) => res.status(500).send(err.message));
//     stream.on("finish", () => {
//       const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
//       res.json({ url: publicUrl });
//     });

//     stream.end(buffer);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });

// app.listen(process.env.PORT || 3003, () => console.log("Storage Service running"));
