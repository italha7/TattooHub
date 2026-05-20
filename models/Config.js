// models/Config.js
const mongoose = require('mongoose');
const ConfigSchema = new mongoose.Schema({
  key:   { type: String, unique: true, required: true },
  value: { type: mongoose.Schema.Types.Mixed }
});
module.exports = mongoose.model('Config', ConfigSchema);
