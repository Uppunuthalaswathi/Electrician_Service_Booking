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

exports.getServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ success: true, service });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
  

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ success: true, message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};