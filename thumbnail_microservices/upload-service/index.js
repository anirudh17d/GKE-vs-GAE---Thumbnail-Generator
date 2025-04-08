import express from "express";
import fileUpload from "express-fileupload";
import dotenv from "dotenv";
import axios from "axios";
import FormData from "form-data";
import path from "path";
dotenv.config();

const app = express();
app.use(express.json());
app.use(fileUpload());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
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
      headers: formData.getHeaders(),
    });

    // Send data to result.html using query string or client-side fetch
    res.send(`
      <script>
        const data = ${JSON.stringify(response.data)};
        localStorage.setItem("uploadResult", JSON.stringify(data));
        window.location.href = "/result.html";
      </script>
    `);
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).send("Upload failed: " + err.message);
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log("Upload Service running on port " + port));
