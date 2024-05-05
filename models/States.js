const mongoose = require('mongoose');

// Define the schema for the state
const stateSchema = new mongoose.Schema({
  stateCode: { type: String, required: true, unique: true },
  funfacts: [{ type: String }]
});

// Create a model from the schema
const State = mongoose.model('State', stateSchema);

module.exports = State;