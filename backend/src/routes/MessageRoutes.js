const express = require("express");
const router = express.Router();

const { getMessages, sendMessage } = require("../controllers/MessageController");
const auth = require("../middleware/auth");

router.get("/:bookingId", auth, getMessages);
router.post("/:bookingId", auth, sendMessage);

module.exports = router;
