// models/Post.js
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title:       { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 1000 },
  image:       { type: String, required: true },
  category:    { type: String, enum: ['minimal','tribal','anime','sleeve','blackwork','realism','geometric','traditional','custom'], default: 'custom' },
  tags:        [{ type: String, maxlength: 30 }],
  pinUrl:      { type: String },
  pinterestId: { type: String, unique: true, sparse: true },
  source:      { type: String, default: 'pinterest' },
  status:      { type: String, enum: ['live','pending','rejected'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
