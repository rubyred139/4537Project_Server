const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const db_utils = require("../database/db_utils");
require("dotenv").config();
const axios = require("axios");

const { sessionValidation } = require("./function/sessionValidation");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // subject to change
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // subject to change
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Function to send the image to the 3D model server and save the result
const simulate3DConversion = async (imagePath) => {
  console.log(`Starting 3D conversion for image at: ${imagePath}`);

  try {
    const serverUrl = process.env.SERVER_URL;
    const username = process.env.SERVER_USERNAME;
    const password = process.env.SERVER_PASSWORD;
    const imageStream = fs.createReadStream(imagePath);

    const response = await axios.post(
      serverUrl,
      { file: imageStream },
      {
        auth: { username, password },
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "stream",
      }
    );

    // Define the path to save the converted 3D model file
    const outputPath = `output_${Date.now()}.glb`;
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log("3D conversion complete, file saved at:", outputPath);
    return outputPath;
  } catch (error) {
    console.error("Error during 3D conversion:", error);
    throw new Error("Failed to convert image to 3D.");
  }
};

// Route to handle file upload, conversion, and response
router.post(
  "/upload",
  sessionValidation,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        console.log("No file uploaded.");
        return res.status(400).json({ error: "Image upload failed." });
      }

      console.log("File uploaded successfully:", req.file.path);

      // Convert the image to a 3D model and get the file path
      const outputFilePath = await simulate3DConversion(req.file.path);

      const userId = req.session.userId;
      const tokensUsed = 1;
      const updateSuccess = await db_utils.updateAPITokens(userId, tokensUsed);

      if (!updateSuccess) {
        return res.status(500).json({ error: "Failed to update API tokens." });
      }
      // Delete the original uploaded file to clean up
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Failed to delete original file:", err);
        }
      });

      console.log("Sending file to client:", outputFilePath);

      // Set headers to trigger a download action on the client side
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="3Dmodel.glb"'
      );
      res.setHeader("Content-Type", "model/gltf-binary");

      // Stream the 3D model file directly to the client
      const fileStream = fs.createReadStream(outputFilePath);
      fileStream
        .pipe(res)
        .on("finish", () => {
          console.log("File stream completed.");

          // Clean up by deleting the file after sending
          fs.unlink(outputFilePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error("Failed to delete 3D model file:", unlinkErr);
            }
          });
        })
        .on("error", (err) => {
          console.error("Failed to send 3D model file:", err);
          res.status(500).json({ error: "Failed to send file." });
        });
    } catch (error) {
      console.error("Error processing image:", error);
      res.status(500).json({ error: "Failed to process the image." });
    }
  }
);

module.exports = router;
