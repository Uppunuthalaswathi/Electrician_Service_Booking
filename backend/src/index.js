const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const seedSampleData = require("./seed/seedSampleData");

const userRoutes = require("./routes/UserRoutes");
const serviceRoutes = require("./routes/ServiceRoutes");
const bookingRoutes = require("./routes/BookingRoutes");
const messageRoutes = require("./routes/MessageRoutes");
const queryRoutes = require("./routes/queryRoutes")


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/query", queryRoutes)
async function bootstrap() {
  await connectDB();
  await seedSampleData();

  app.use("/api/users", userRoutes);
  app.use("/api/services", serviceRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/messages", messageRoutes);

  app.get("/", (req, res) => {
    res.send("ElectroServe Backend Running");
  });

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Server bootstrap failed", error);
  process.exit(1);
});
