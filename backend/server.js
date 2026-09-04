require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const nodemailer = require("nodemailer");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 5000;
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(ROOT, "assets", "uploads");
const PROFILE_FILE = path.join(DATA_DIR, "profile.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, "[]");

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(ROOT));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOAD_DIR),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `profile-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, WEBP and GIF images are allowed."));
  }
});

function getProfile() {
  return JSON.parse(fs.readFileSync(PROFILE_FILE, "utf8"));
}
function saveProfile(profile) {
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2));
}
function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_EDIT_TOKEN;
  if (!expected) return next();
  if (req.headers["x-admin-token"] !== expected) {
    return res.status(401).json({ error: "Invalid admin token." });
  }
  next();
}

app.get("/api/health", (_, res) => {
  res.json({ ok: true, service: "Ranjesh Portfolio API", time: new Date().toISOString() });
});

app.get("/api/profile", (_, res) => {
  res.json(getProfile());
});

app.put("/api/profile", requireAdmin, (req, res) => {
  const current = getProfile();
  const next = { ...current, ...req.body };
  saveProfile(next);
  res.json(next);
});

app.post("/api/upload-image", requireAdmin, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded." });
  res.json({ ok: true, url: `/assets/uploads/${req.file.filename}` });
});

app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email and message are required." });
  }

  const entry = {
    id: Date.now().toString(),
    name: String(name).slice(0, 120),
    email: String(email).slice(0, 160),
    message: String(message).slice(0, 5000),
    createdAt: new Date().toISOString()
  };

  const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf8"));
  messages.push(entry);
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

  let emailSent = false;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.CONTACT_TO) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.CONTACT_TO,
        replyTo: email,
        subject: `Portfolio message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`
      });
      emailSent = true;
    } catch (err) {
      console.error("SMTP error:", err.message);
    }
  }

  res.json({ ok: true, saved: true, emailSent });
});

function localAnswer(question, profile) {
  const q = question.toLowerCase();
  if (q.includes("skill") || q.includes("technology") || q.includes("tech"))
    return `Ranjesh's highlighted skills are ${profile.skills.join(", ")}. His main focus is AI/ML, web development and problem solving.`;
  if (q.includes("project"))
    return profile.projects.map(p => `${p.name}: ${p.description}`).join("\n");
  if (q.includes("education") || q.includes("study") || q.includes("college"))
    return `Education: ${profile.education.join("; ")}.`;
  if (q.includes("contact") || q.includes("email") || q.includes("reach"))
    return `You can contact Ranjesh through the Contact section. The current portfolio email is ${profile.contact.email}.`;
  if (q.includes("website") || q.includes("built") || q.includes("stack"))
    return "This portfolio uses HTML, CSS and JavaScript on the frontend, with a Node.js/Express backend for the chatbot, contact form, profile API and image uploads.";
  return profile.bio;
}

app.post("/api/chat", async (req, res) => {
  const question = String(req.body?.message || "").trim();
  if (!question) return res.status(400).json({ error: "Message is required." });

  const profile = getProfile();

  if (!process.env.OPENAI_API_KEY) {
    return res.json({ reply: localAnswer(question, profile), source: "local" });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions:
        `You are the portfolio assistant for ${profile.name}. Answer only using the portfolio facts below. ` +
        `Be friendly, concise and professional. If the user asks for something not present, say you don't have that information and direct them to the Contact section.\n\n` +
        JSON.stringify(profile),
      input: question
    });
    res.json({ reply: response.output_text || localAnswer(question, profile), source: "openai" });
  } catch (err) {
    console.error("OpenAI error:", err.message);
    res.json({ reply: localAnswer(question, profile), source: "fallback" });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes("Only JPG")) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Server error." });
});

app.get("/{*splat}", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API route not found." });
  res.sendFile(path.join(ROOT, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Ranjesh Portfolio running at http://localhost:${PORT}`);
});
