const express = require("express");
const router = express.Router();

const { createService,getServices,updateService,deleteService } = require("../controllers/ServiceController");

const auth = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

// 🔧 Only electrician can create service
router.post("/create", auth, roleMiddleware("electrician"), createService);

// 🔍 Get all services (public or logged-in)
router.get("/", getServices);

// 👑 Admin - Update service
router.put(
  "/:id",
  auth,
  roleMiddleware("admin"),
  updateService
);

// 👑 Admin - Delete service
router.delete(
  "/:id",
  auth,
  roleMiddleware("admin"),
  deleteService
);
module.exports = router;