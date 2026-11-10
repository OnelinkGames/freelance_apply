import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { router as apiRouter } from "./routes/api.js";
import { dbPath } from "./db/client.js";
import { getBackendPort, getFrontendPort } from "./lib/ports.js";
import { ensureAgentsSeeded } from "./services/agentService.js";

ensureAgentsSeeded();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = getBackendPort();
const FRONTEND_PORT = getFrontendPort();
const isProd = process.env.NODE_ENV === "production";

const app = express();
app.use(express.json({ limit: "2mb" }));

app.use("/api", apiRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Erro interno do servidor" });
});

if (isProd) {
  const distPath = path.join(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Freelance Flow API running on http://localhost:${PORT}`);
  console.log(`Database: ${dbPath}`);
  if (!isProd) {
    console.log(`Frontend (dev): http://localhost:${FRONTEND_PORT}`);
  }
});
