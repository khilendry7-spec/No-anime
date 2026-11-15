const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, "videos.json");
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/videos", express.static(UPLOAD_DIR, { fallthrough: false }));

const readVideos = () => JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
const writeVideos = (items) => fs.writeFileSync(DB_FILE, JSON.stringify(items, null, 2));
const sessions = new Set();

function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token || !sessions.has(token)) return res.status(401).json({ error: "Admin login required" });
  next();
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomUUID() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
    cb(allowed.includes(file.mimetype) ? null : new Error("Only MP4, WebM, OGG or MOV videos are allowed"), allowed.includes(file.mimetype));
  }
});

app.get("/api/videos", (_req, res) => res.json(readVideos()));
app.post("/api/admin/login", (req, res) => {
  if (!ADMIN_PASSWORD) return res.status(503).json({ error: "Set ADMIN_PASSWORD in your hosting environment first." });
  if (!req.body || req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Incorrect password" });
  const token = crypto.randomBytes(32).toString("hex");
  sessions.add(token);
  res.json({ token });
});
app.post("/api/admin/upload", requireAdmin, upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose a video file" });
  const title = String(req.body.title || "").trim().slice(0, 120) || "Untitled anime";
  const episode = String(req.body.episode || "").trim().slice(0, 80);
  const item = {
    id: crypto.randomUUID(), title, episode,
    filename: req.file.filename,
    url: "/videos/" + encodeURIComponent(req.file.filename),
    uploadedAt: new Date().toISOString()
  };
  const items = readVideos();
  items.unshift(item);
  writeVideos(items);
  res.status(201).json(item);
});
app.delete("/api/admin/videos/:id", requireAdmin, (req, res) => {
  const items = readVideos();
  const item = items.find(v => v.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Video not found" });
  const next = items.filter(v => v.id !== req.params.id);
  writeVideos(next);
  const filePath = path.join(UPLOAD_DIR, path.basename(item.filename));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ ok: true });
});
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.use((err, _req, res, _next) => {
  res.status(err instanceof multer.MulterError ? 413 : 400).json({ error: err.message || "Upload failed" });
});

app.listen(PORT, () => console.log(`No anime running on port ${PORT}`));
