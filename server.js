require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require("multer");
const sharp = require("sharp");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const connectDatabase = async () => {
    try {
        await pool.query("SELECT NOW()");
        console.log("✅ Connected to PostgreSQL");
    } catch (err) {
        console.error("❌ Database connection error:", err.message);
        setTimeout(connectDatabase, 5000);
    }
};
connectDatabase();

const createTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_signins (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_profile_changes (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                old_name TEXT,
                new_name TEXT,
                old_email TEXT,
                new_email TEXT,
                change_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS artworks (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                image_url TEXT NOT NULL,
                category TEXT,
                color_palette TEXT,
                price DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("✅ All required tables checked/created.");
    } catch (error) {
        console.error("❌ Error creating tables:", error.message);
    }
};
createTables();

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
            [name, email, hashedPassword]
        );

        res.json({ message: "User created!", user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) return res.status(401).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        await pool.query("INSERT INTO user_signins (user_id, ip_address) VALUES ($1, $2)", [user.rows[0].id, req.ip]);

        res.json({ message: "Login successful!" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/artworks", async (req, res) => {
    const { title, artist, image_url, category, color_palette, price } = req.body;
    if (!title || !artist || !image_url || !price) {
        return res.status(400).json({ error: "Title, artist, image URL, and price are required" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO artworks (title, artist, image_url, category, color_palette, price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [title, artist, image_url, category, color_palette, price]
        );

        res.json({ message: "Artwork added successfully!", artwork: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/artworks", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM artworks ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// 🔥 AI Integration with Python microservice
const upload = multer({ storage: multer.memoryStorage() });

app.post("/analyze-art", upload.single("artwork"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    try {
        const form = new FormData();
        form.append("artwork", req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        const response = await axios.post("http://localhost:5000/analyze", form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        res.json({
            ...response.data,
            imagePath: `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
        });

    } catch (error) {
        console.error("AI processing error:", error.message || error);
        res.status(500).json({ error: "AI analysis failed" });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
