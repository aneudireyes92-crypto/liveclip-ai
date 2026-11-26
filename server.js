
import express from "express";
import cors from "cors";
import multer from "multer";
import ffmpegPath from "ffmpeg-static";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const app = express();
const PORT = process.env.PORT || 3000;
const runFile = promisify(execFile);

const uploadDirectory = path.join(process.cwd(), "uploads");
const clipsDirectory = path.join(process.cwd(), "clips");

fs.mkdirSync(uploadDirectory, { recursive: true });
fs.mkdirSync(clipsDirectory, { recursive: true });

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    callback(null, crypto.randomUUID() + ".mp4");
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    const isMp4 =
      file.mimetype === "video/mp4" ||
      path.extname(file.originalname).toLowerCase() === ".mp4";

    if (!isMp4) {
      return callback(new Error("Solo se permiten videos MP4."));
    }

    callback(null, true);
  }
});

app.get("/", (req, res) => {
  res.json({
    app: "LIVECLIP AI",
    status: "Servidor funcionando",
    engine: ffmpegPath ? "FFmpeg preparado" : "FFmpeg no disponible"
  });
});

// Recibir enlaces
app.post("/analyze", (req, res) => {
  const { url, platform } = req.body;

  if (!url || !platform) {
    return res.status(400).json({
      success: false,
      message: "Falta el enlace o la plataforma."
    });
  }

  res.json({
    success: true,
    message: "Enlace recibido.",
    platform,
    analysis: "El análisis de transmisiones está pendiente."
  });
});

// Subir video y generar clip de prueba
app.post("/upload", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No se recibió ningún video."
    });
  }

  const inputPath = req.file.path;
  const clipName = crypto.randomUUID() + ".mp4";
  const outputPath = path.join(clipsDirectory, clipName);

  try {
    if (!ffmpegPath) {
      throw new Error("El motor FFmpeg no está disponible.");
    }

    await runFile(ffmpegPath, [
      "-y",
      "-i", inputPath,
      "-t", "20",
      "-map", "0:v:0",
      "-map", "0:a?",
      "-vf",
      "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", "28",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      outputPath
    ], {
      timeout: 180000,
      maxBuffer: 10 * 1024 * 1024
    });

    if (!fs.existsSync(outputPath)) {
      throw new Error("No se pudo crear el clip.");
    }

    res.json({
      success: true,
      message: "¡Tu clip de prueba está listo!",
      clip: clipName,
      downloadUrl: `/clips/${clipName}`
    });

  } catch (error) {
    console.error("Error FFmpeg:", error.message);

    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    res.status(500).json({
      success: false,
      message: "No se pudo procesar el video. Comprueba que sea un MP4 válido."
    });

  } finally {
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }
  }
});

// Descargar clips
app.get("/clips/:filename", (req, res) => {
  const filename = req.params.filename;

  if (!/^[a-f0-9-]+\.mp4$/i.test(filename)) {
    return res.status(400).json({
      success: false,
      message: "Nombre de archivo inválido."
    });
  }

  const clipPath = path.join(clipsDirectory, filename);

  if (!fs.existsSync(clipPath)) {
    return res.status(404).json({
      success: false,
      message: "El clip no existe o ya no está disponible."
    });
  }

  res.download(clipPath, "LIVECLIP-" + filename);
});

// Errores de subida
app.use((error, req, res, next) => {
  console.error(error.message);

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: "El video supera el límite permitido de 100 MB."
    });
  }

  res.status(400).json({
    success: false,
    message: error.message || "Error al procesar la solicitud."
  });
});

app.listen(PORT, () => {
  console.log("LIVECLIP AI funcionando en el puerto " + PORT);
});
