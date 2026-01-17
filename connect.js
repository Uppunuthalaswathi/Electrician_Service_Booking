const mongoose = require("mongoose");

const connectMongoose = async () => {
  try {
    const uri = "mongodb://127.0.0.1:27017/electroserve"; // MongoDB local URI
    await mongoose.connect(uri); // Options are optional for Mongoose >= 6
    console.log("MongoDB connected successfully ✅");
  } catch (error) {
    console.error("MongoDB connection error ❌:", error);
    process.exit(1); // Exit process if DB connection fails
  }
};

module.exports = connectMongoose;
