
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const app = express();
const PORT = process.env.PORT || 3000;

// Crear carpeta temporal para los videos
const uploadDirectory = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Configuración para recibir videos
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const filename = crypto.randomUUID() + ".mp4";
    callback(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== "video/mp4") {
      return callback(
        new Error("Solo se permiten archivos MP4.")
      );
    }

    callback(null, true);
  }
});

// Comprobar que el servidor funciona
app.get("/", (req, res) => {
  res.json({
    app: "LIVECLIP AI",
    status: "Servidor funcionando",
    message: "Motor de recepción de videos preparado"
  });
});

// Recibir enlace de transmisión
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
    message: "Enlace recibido por el servidor.",
    platform,
    analysis: "El análisis automático todavía está pendiente."
  });
});

// Recibir archivo MP4
app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No se recibió ningún video."
    });
  }

  res.json({
    success: true,
    message: "Video recibido correctamente.",
    filename: req.file.filename,
    size: req.file.size,
    processing: "Pendiente de conectar el motor de clips."
  });
});

// Manejar errores de subida
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: "Error al subir el archivo. Comprueba su tamaño."
    });
  }

  res.status(400).json({
    success: false,
    message: error.message || "Error al procesar la solicitud."
  });
});

app.listen(PORT, () => {
  console.log(
    `LIVECLIP AI funcionando en el puerto ${PORT}`
  );
});
