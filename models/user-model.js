const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  // Google login
  name: {
    type: String,
    required: true,
    minLength: 6,
    maxLength: 255,
  },
  googleID: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  thumbnail: {
    type: String,
  },

  // Local Login
  email: {
    type: String,
  },
  password: {
    type: String,
    maxLength: 1024,
  },
});

module.exports = mongoose.model("User", userSchema);
