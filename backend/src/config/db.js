const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB Atlas Connected Successfully");
  } catch (error) {
    console.log("MongoDB Connection Failed");

    const message = String(error?.message || "");
    if (
      message.includes("whitelist") ||
      message.includes("SSL") ||
      message.includes("tls") ||
      message.includes("Could not connect to any servers")
    ) {
      console.error(
        "Atlas connection was rejected. Check that your current IP is allowed in MongoDB Atlas Network Access and that the MONGO_URI is correct."
      );
    }

    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
