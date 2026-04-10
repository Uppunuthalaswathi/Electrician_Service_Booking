const express = require("express")

const router = express.Router()

const Service = require("../models/Service")

router.get("/count", async (req, res) => {
  const count = await Service.countDocuments()
  res.json({ totalServices: count })
})

router.get("/limit", async (req, res) => {
  const services = await Service.find().limit(2)
  res.json(services)
})

router.get("/sort", async (req, res) => {
  const services = await Service.find().sort({ price: 1 })
  res.json(services)
})

router.get("/skip", async (req, res) => {
  const services = await Service.find().skip(1)
  res.json(services)
})

module.exports = router