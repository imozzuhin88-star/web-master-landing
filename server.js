const path = require("path");
const fs = require("fs");
const http = require("http");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const { DatabaseSync } = require("node:sqlite");
const { Server } = require("socket.io");
const { z } = require("zod");

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
if (!ADMIN_TOKEN) throw new Error("Set ADMIN_TOKEN before starting the server.");
const root = __dirname;
const uploadDir = path.join(root, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const db = new DatabaseSync(path.join(root, "data.sqlite"));
db.exec(`PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, room TEXT NOT NULL, author TEXT NOT NULL, text TEXT, fileUrl TEXT, fileName TEXT, fileType TEXT, createdAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL, service TEXT, budget TEXT, message TEXT, createdAt TEXT NOT NULL);`);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: false } });
let adminCount = 0;
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "30kb" }));
app.use("/uploads", express.static(uploadDir, { maxAge: "7d", index: false }));
app.use("/css", express.static(path.join(root, "css"), { maxAge: "1d", index: false }));
app.use("/js", express.static(path.join(root, "js"), { maxAge: "1d", index: false }));
app.use("/assets", express.static(path.join(root, "assets"), { maxAge: "7d", index: false }));
app.get(["/", "/index.html"], (_, res) => res.sendFile(path.join(root, "index.html")));
app.get("/admin.html", (_, res) => res.sendFile(path.join(root, "admin.html")));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: "draft-7", legacyHeaders: false });
const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false });
const leadSchema = z.object({ name: z.string().trim().min(2).max(80), phone: z.string().trim().min(5).max(32), service: z.string().trim().max(80).optional(), budget: z.string().trim().max(80).optional(), message: z.string().trim().max(1500).optional() });
const messageSchema = z.object({ id: z.string().uuid(), room: z.string().uuid(), author: z.enum(["visitor", "seller"]), text: z.string().trim().max(1000).optional(), fileUrl: z.string().max(250).optional(), fileName: z.string().max(180).optional(), fileType: z.string().max(100).optional(), createdAt: z.string().datetime() }).refine((value) => value.text || value.fileUrl, "Message cannot be empty");
const storage = multer.diskStorage({ destination: uploadDir, filename: (_, file, callback) => callback(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${path.extname(file.originalname).toLowerCase()}`) });
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024, files: 1 }, fileFilter: (_, file, callback) => callback(null, /^(image\/(jpeg|png|webp|gif)|application\/pdf|text\/plain|application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))$/.test(file.mimetype)) });
function saveMessage(message) { db.prepare("INSERT OR IGNORE INTO messages (id, room, author, text, fileUrl, fileName, fileType, createdAt) VALUES (@id, @room, @author, @text, @fileUrl, @fileName, @fileType, @createdAt)").run({ text: null, fileUrl: null, fileName: null, fileType: null, ...message }); }
function hasAdminAccess(token) { return typeof token === "string" && token.length === ADMIN_TOKEN.length && require("crypto").timingSafeEqual(Buffer.from(token), Buffer.from(ADMIN_TOKEN)); }
function broadcastPresence() { io.emit("presence", { online: adminCount > 0 }); }

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.get("/api/messages", limiter, (req, res) => { const room = z.string().uuid().safeParse(req.query.room); if (!room.success) return res.status(400).json({ error: "Некорректная комната" }); res.json(db.prepare("SELECT * FROM messages WHERE room = ? ORDER BY createdAt ASC LIMIT 100").all(room.data)); });
app.post("/api/leads", limiter, (req, res) => { const lead = leadSchema.safeParse(req.body); if (!lead.success) return res.status(400).json({ error: "Проверьте заполнение формы" }); db.prepare("INSERT INTO leads (name, phone, service, budget, message, createdAt) VALUES (?, ?, ?, ?, ?, ?)").run(lead.data.name, lead.data.phone, lead.data.service || null, lead.data.budget || null, lead.data.message || null, new Date().toISOString()); res.status(201).json({ ok: true }); });
app.post("/api/uploads", limiter, upload.single("file"), (req, res) => { if (!req.file || !z.string().uuid().safeParse(req.body.room).success) return res.status(400).json({ error: "Файл или комната не прошли проверку" }); res.status(201).json({ fileUrl: `/uploads/${req.file.filename}`, fileName: req.file.originalname, fileType: req.file.mimetype }); });
app.post("/api/admin/login", adminLimiter, (req, res) => { if (!hasAdminAccess(req.body?.token)) return res.status(401).json({ error: "Неверный код доступа" }); res.json({ ok: true }); });
app.get("/api/admin/rooms", adminLimiter, (req, res) => { if (!hasAdminAccess(req.headers.authorization?.replace("Bearer ", ""))) return res.status(401).json({ error: "Требуется доступ" }); res.json(db.prepare("SELECT room, MAX(createdAt) AS lastActivity, MAX(text) AS lastMessage FROM messages GROUP BY room ORDER BY lastActivity DESC LIMIT 100").all()); });
app.use((error, _, res, __) => { if (error instanceof multer.MulterError) return res.status(400).json({ error: "Файл слишком большой или не поддерживается" }); console.error(error); res.status(500).json({ error: "Внутренняя ошибка сервера" }); });

io.on("connection", (socket) => {
  socket.on("join", ({ room }) => { if (!z.string().uuid().safeParse(room).success) return; socket.join(room); socket.emit("presence", { online: adminCount > 0 }); });
  socket.on("admin-join", ({ token, room }) => { if (!hasAdminAccess(token)) return socket.emit("error-message", { error: "Доступ запрещен" }); if (!socket.data.isAdmin) { socket.data.isAdmin = true; adminCount += 1; broadcastPresence(); } if (room && z.string().uuid().safeParse(room).success) socket.join(room); });
  socket.on("typing", (data) => { if (!z.string().uuid().safeParse(data?.room).success) return; socket.to(data.room).emit("typing", { active: Boolean(data.active) }); });
  socket.on("message", (data) => { const message = messageSchema.safeParse(data); if (!message.success || (message.data.author === "seller" && !socket.data.isAdmin)) return socket.emit("error-message", { error: "Сообщение не прошло проверку" }); saveMessage(message.data); io.to(message.data.room).emit("message", message.data); });
  socket.on("disconnect", () => { if (socket.data.isAdmin) { adminCount = Math.max(0, adminCount - 1); broadcastPresence(); } });
});
server.listen(PORT, () => console.log(`Web master is running on http://localhost:${PORT}`));
