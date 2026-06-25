const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const app = express();

/* ──────────────────────────────────────────────────────────
   CORS CONFIGURATION
────────────────────────────────────────────────────────── */

const allowedOrigins = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:58654",
  "https://johndaro7.github.io",
  "https://crop-climate-recommendation-system-a1z7.onrender.com"
];

const corsOptions = {
  origin: (origin, callback) => {
    console.log("Incoming Origin:", origin);

    // Allow requests with no origin
    // (Postman, mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", normalizedOrigin);
      callback(new Error("Not allowed by CORS"));
    }
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization"
  ],

  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options(/.*/, cors(corsOptions));

app.use(express.json());
