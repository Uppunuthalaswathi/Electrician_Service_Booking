const express = require("express");
const router = express.Router();

const {
  createService,
  getServices,
  getMyServiceProfile,
  getAllServicesForAdmin,
  createServiceAsAdmin,
  updateMyServiceProfile,
  updateService,
  deleteService,
} = require("../controllers/ServiceController");

const auth = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/", getServices);
router.post("/create", auth, roleMiddleware("electrician"), createService);
router.get("/me", auth, roleMiddleware("electrician"), getMyServiceProfile);
router.put("/me", auth, roleMiddleware("electrician"), updateMyServiceProfile);
router.get("/admin/all", auth, roleMiddleware("admin"), getAllServicesForAdmin);
router.post("/admin/create", auth, roleMiddleware("admin"), createServiceAsAdmin);
router.put("/:id", auth, roleMiddleware("admin"), updateService);
router.delete("/:id", auth, roleMiddleware("admin"), deleteService);

module.exports = router;
