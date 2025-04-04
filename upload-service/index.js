import express from "express";
import fileUpload from "express-fileupload";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const app = express();
app.use(express.json());
app.use(fileUpload());

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

    res.json(response.data);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(process.env.PORT || 3001, () => console.log("Upload Service running"));
