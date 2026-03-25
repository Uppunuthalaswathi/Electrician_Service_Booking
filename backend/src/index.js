const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const userRoutes = require("./routes/UserRoutes");
const serviceRoutes = require("./routes/ServiceRoutes");
const bookingRoutes = require("./routes/BookingRoutes");

dotenv.config();

const app = express();

app.use(express.json());

connectDB();

app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/", (req, res) => {
  res.send("ElectroServe Backend Running");
});

const PORT = process.env.PORT || 5000;

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});