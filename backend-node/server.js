const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const app = express();
const allowedOrigins = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:3000",
  "http://localhost:5000",
  "https://johndaro7.github.io",
  "https://www.johndaro7.github.io",
];

const corsOptions = {
  origin: (origin, callback) => {
    const normalizedOrigin = origin ? origin.replace(/\/$/, "") : null;

    if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
};

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

// ── MONGODB CONNECTION ─────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI ||
  "mongodb+srv://JOHNDARO:exmartial2003@cluster0.5nwpjbf.mongodb.net/?appName=Cluster0&tls=true";

let db;

async function connectDB() {
  const client = new MongoClient(MONGO_URI, {
    tls: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 20000,
    connectTimeoutMS: 20000,
    retryWrites: true,
    w: "majority",
  });
  await client.connect();
  db = client.db("crop_recommendation_db");
  console.log("✅ Connected to MongoDB Atlas");
}

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.head("/", (req, res) => {
  res.sendStatus(200);
});

// ── AUTH: REGISTER ─────────────────────────────────────────────────────────────
app.post("/register", async (req, res) => {
  try {
    const { name = "", email = "", password = "" } = req.body || {};

    if (!name.trim() || !email.trim() || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.collection("users").findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPw = await bcrypt.hash(password, 10);
    const result = await db.collection("users").insertOne({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPw,
    });

    res.status(201).json({
      message: "Account registered successfully!",
      user_id: result.insertedId.toString(),
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// ── AUTH: LOGIN ───────────────────────────────────────────────────────────────
app.post("/login", async (req, res) => {
  try {
    const { email = "", password = "" } = req.body || {};

    if (!email.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.collection("users").findOne({ email: normalizedEmail });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.status(200).json({
      message: "Login successful!",
      user_id: user._id.toString(),
      name: user.name || "",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// ── CLIMATE DATA: SAVE ────────────────────────────────────────────────────────
async function saveClimateData(data, res) {
  try {
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No data received" });
    }
    await db.collection("climate_data").insertOne(data);
    res.status(201).json({ message: "Data saved successfully!" });
  } catch (err) {
    console.error("Save climate error:", err);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
}

app.post("/climate", (req, res) => saveClimateData(req.body, res));
app.post("/save-data", (req, res) => saveClimateData(req.body, res));

// ── RECOMMEND ─────────────────────────────────────────────────────────────────
app.post("/recommend", (req, res) => {
  try {
    const { temperature = 0, humidity = 0, soil_ph = 7.0 } = req.body || {};
    const temp = parseFloat(temperature);
    const hum  = parseFloat(humidity);
    const ph   = parseFloat(soil_ph);

    let crop;
    if (temp > 20 && hum > 50 && ph > 6.0) {
      crop = "Rice";
    } else if (temp > 25 && hum < 40) {
      crop = "Maize";
    } else {
      crop = "Wheat";
    }

    res.json({ crop });
  } catch (err) {
    console.error("Recommend error:", err);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// ── HISTORY ───────────────────────────────────────────────────────────────────
app.get("/get-history", async (req, res) => {
  try {
    const history = await db.collection("climate_data")
      .find()
      .sort({ _id: -1 })
      .limit(5)
      .toArray();

    history.forEach(entry => { entry._id = entry._id.toString(); });
    res.json(history);
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    console.log("✅ MongoDB connection ready");
  } catch (err) {
    console.error("⚠️ MongoDB connection failed:", err.message);
    console.log("🚀 Starting server without a database connection; auth and data routes will be unavailable until MongoDB is reachable.");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
