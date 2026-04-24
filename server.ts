import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const DB_PATH = path.join(process.cwd(), 'db.json');

  app.use(express.json());

  // Initialize local DB if not exists
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ templates: [], records: [] }));
  }

  const getData = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  const saveData = (data: any) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

  // --- API Routes ---

  // Templates API
  app.get("/api/templates", (req, res) => {
    const data = getData();
    res.json(data.templates);
  });

  app.post("/api/templates", (req, res) => {
    const data = getData();
    const newTemplate = req.body;
    
    const index = data.templates.findIndex((t: any) => t.id === newTemplate.id);
    if (index > -1) {
      data.templates[index] = { ...newTemplate, updatedAt: Date.now() };
    } else {
      data.templates.push({ ...newTemplate, createdAt: Date.now() });
    }
    
    saveData(data);
    res.json({ success: true });
  });

  app.delete("/api/templates/:id", (req, res) => {
    const data = getData();
    data.templates = data.templates.filter((t: any) => t.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
  });

  // Records API
  app.get("/api/records", (req, res) => {
    const data = getData();
    res.json(data.records);
  });

  app.post("/api/records", (req, res) => {
    const data = getData();
    const newRecord = { ...req.body, id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() };
    data.records.unshift(newRecord);
    saveData(data);
    res.json(newRecord);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
