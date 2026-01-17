const mongoose = require('mongoose');

const electricianSchema = new mongoose.Schema({
  name: { type: String, required: true },
  serviceType: { type: String },
  experience: { type: Number },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Electrician', electricianSchema);
