const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const { Parser } = require("json2csv");
const fs = require("fs");

const app = express();
const PORT = 5000;
const SECRET = "your_secret_key";

app.use(cors());
app.use(bodyParser.json());

// Load transactions from uploaded transactions.json
let TRANSACTIONS = [];
try {
  const rawData = fs.readFileSync("./transactions.json", "utf-8");
  TRANSACTIONS = JSON.parse(rawData);
} catch (err) {
  console.error("❌ Failed to load transactions.json:", err.message);
  TRANSACTIONS = [];
}

// Dummy user
const USERS = [{ username: "abc", password: "1234" }];

// Login Route
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username && u.password === password);

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
  res.json({ token });
});

// Auth middleware
function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.sendStatus(401);

  const token = auth.split(" ")[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.sendStatus(403);
  }
}

// GET Transactions (only for user_001 / abc)
app.get("/api/transactions", verifyToken, (req, res) => {
  const filtered = TRANSACTIONS.filter(t => t.user_id === "user_001");
  res.json(filtered);
});

// CSV Export Route
app.get("/api/export", verifyToken, (req, res) => {
  const fields = req.query.fields;
  const fieldArray = Array.isArray(fields) ? fields : [fields];
  if (!fieldArray || fieldArray.length === 0) {
    return res.status(400).json({ message: "No fields provided" });
  }

  const filtered = TRANSACTIONS.filter(t => t.user_id === "user_001");
  const parser = new Parser({ fields: fieldArray });
  const csv = parser.parse(filtered);

  res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
  res.set("Content-Type", "text/csv");
  res.send(csv);
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
