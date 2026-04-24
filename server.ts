import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import admin from "firebase-admin";

// Initialize Firebase Admin with Service Account from Env
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
  try {
    const formattedKey = privateKey.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formattedKey,
      }),
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
  }
} else {
  console.warn("FIREBASE_PRIVATE_KEY is not defined. Firebase features will not work.");
}

const db = admin.apps.length ? admin.firestore() : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", firebase: !!db });
  });

  // --- API Routes ---

  app.get("/api/templates", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    try {
      const snapshot = await db.collection('templates').get();
      const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates", details: error.message });
    }
  });

  app.post("/api/templates", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    try {
      const template = req.body;
      await db.collection('templates').doc(template.id).set({
        ...template,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save template" });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    try {
      await db.collection('templates').doc(req.params.id).delete();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  app.get("/api/records", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    try {
      const snapshot = await db.collection('records').orderBy('createdAt', 'desc').get();
      const records = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis?.() || Date.now()
        };
      });
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch records" });
    }
  });

  app.post("/api/records", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    try {
      const record = {
        ...req.body,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      const docRef = await db.collection('records').add(record);
      res.json({ id: docRef.id, ...record });
    } catch (error) {
      res.status(500).json({ error: "Failed to save record" });
    }
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
