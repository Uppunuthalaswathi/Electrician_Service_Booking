const Service = require("../models/Service");

exports.createService = async (req, res) => {
  try {

    const service = new Service(req.body);

    const savedService = await service.save();

    res.status(201).json(savedService);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }
};