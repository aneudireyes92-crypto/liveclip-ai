import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    app: "LIVECLIP AI",
    status: "Servidor funcionando",
    message: "Bienvenido al motor de LIVECLIP AI"
  });
});

app.post("/analyze", (req, res) => {
  const { url, platform } = req.body;

  if (!url || !platform) {
    return res.status(400).json({
      success: false,
      message: "Falta el enlace o la plataforma."
    });
  }

  if (platform !== "YouTube") {
    return res.status(400).json({
      success: false,
      message: "Por ahora solo estamos preparando YouTube."
    });
  }

  res.json({
    success: true,
    message: "Enlace recibido por el servidor.",
    url: url,
    platform: platform,
    analysis: "El motor de análisis todavía está pendiente de conexión."
  });
});

app.listen(PORT, () => {
  console.log(`LIVECLIP AI funcionando en el puerto ${PORT}`);
});
