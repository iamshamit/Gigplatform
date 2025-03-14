const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: String,
  description: String,
  // Add more fields as needed
});

module.exports = mongoose.model('Job', jobSchema); 