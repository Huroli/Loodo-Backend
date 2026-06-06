import express from "express";
import upload from "../middlewares/mediaUploadMiddleware.js";
import { uploadMedia } from "../controllers/mediaController.js";

// Express Router tanımlanıyor.
const router = express.Router();

// Hangi route isteğinde hangi fonksiyonun çalışacağı tanımlanıyor.
router.post('/upload-media', upload.single('file'), uploadMedia);

export default router;