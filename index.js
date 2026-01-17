const express = require("express");
const connectMongoose = require("./connect");

// Import all your models
require("./User");
require("./Booking");
require("./Service");
require("./Admin");
require("./Electrician");

const app = express();
app.use(express.json());

// Connect to MongoDB and start server
const startServer = async () => {
  await connectMongoose();

  // Example route
  app.get("/", (req, res) => {
    res.send("Electroserve API running");
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();
