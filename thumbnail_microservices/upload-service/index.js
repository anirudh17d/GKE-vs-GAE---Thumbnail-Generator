import express from "express";
import fileUpload from "express-fileupload";
import dotenv from "dotenv";
import axios from "axios";
import FormData from "form-data";
dotenv.config();

const app = express();
app.use(express.json());
app.use(fileUpload());

app.get("/", (req, res) => {
  res.send(`
    <h2>📤 Upload Image</h2>
    <form method="POST" action="/upload" enctype="multipart/form-data">
      <label>User ID:</label><br />
      <input type="text" name="user" required /><br /><br />
      <label>Select image:</label><br />
      <input type="file" name="image" accept="image/*" required /><br /><br />
      <button type="submit">Upload</button>
    </form>
  `);
});

app.post("/upload", async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).send("No image uploaded");
    }

    const formData = new FormData();
    formData.append("image", req.files.image.data, req.files.image.name);
    formData.append("user", req.body.user);

    const response = await axios.post(process.env.THUMBNAIL_SERVICE_URL, formData, {
      headers: formData.getHeaders()
    });

    res.json(response.data);
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).send("Upload failed: " + err.message);
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log("Upload Service running on port " + port));
