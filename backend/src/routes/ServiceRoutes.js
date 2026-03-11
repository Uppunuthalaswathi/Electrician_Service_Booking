const express = require("express");
const router = express.Router();

const { createService } = require("../controllers/ServiceController");

router.post("/create", createService);

module.exports = router;