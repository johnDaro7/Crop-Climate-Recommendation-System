const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const app = express();

// -------------------- CORS --------------------

const allowedOrigins = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:58654",
  "https://johndaro7.github.io",
  "https://crop-climate-recommendation-system-a1z7.onrender.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

app.use(express.json());

// -------------------- DATABASE --------------------

const MONGO_URI = process.env.MONGO_URI;

let db = null;

async function connectDB() {
  if (!MONGO_URI) {
    console.log("⚠️ MONGO_URI not found");
    return;
  }

  const client = new MongoClient(MONGO_URI);

  await client.connect();

  db = client.db("crop_recommendation_db");

  console.log("✅ Connected to MongoDB");
}

// -------------------- ROUTES --------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running"
  });
});

app.post("/register", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        message: "Database not connected"
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const existingUser = await db.collection("users").findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.collection("users").insertOne({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date()
    });

    res.status(201).json({
      message: "Registration successful",
      userId: result.insertedId.toString()
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        message: "Database not connected"
      });
    }

    const { email, password } = req.body;

    const user = await db.collection("users").findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    res.json({
      message: "Login successful",
      user_id: user._id.toString(),
      name: user.name
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
});

app.post("/recommend", (req, res) => {
  try {
    const { temperature, humidity, soil_ph } = req.body;

    let crop = "Wheat";

    if (
      Number(temperature) > 20 &&
      Number(humidity) > 50 &&
      Number(soil_ph) > 6
    ) {
      crop = "Rice";
    } else if (
      Number(temperature) > 25 &&
      Number(humidity) < 40
    ) {
      crop = "Maize";
    }

    res.json({ crop });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
});

// -------------------- SERVER --------------------

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup Error:");
    console.error(error);
    process.exit(1);
  }
}

startServer();