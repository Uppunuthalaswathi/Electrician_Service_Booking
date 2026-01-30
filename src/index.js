const express = require("express");
const mongoose = require("mongoose");

// import model (make sure path is correct)
const User = require("./models/User");

const app = express();

// middleware
app.use(express.json());

// ⚠️ MongoDB Atlas URL (TEMP – move to .env later)
const DB_URL =
  "mongodb+srv://24wh5a0501_db_user:0qlbWIM9mhZwpwDz@cluster0.ookiplm.mongodb.net/";

// connect to MongoDB
mongoose
  .connect(DB_URL)
  .then(() => {
    console.log("MongoDB Atlas connected ✅");
  })
  .catch((err) => {
    console.error("MongoDB connection error ❌", err);
  });

// test route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

//posting the data to users
app.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// example test API (optional)
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
