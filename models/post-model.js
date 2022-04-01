const mongoose = require("mongoose");

// const commentSchema = new mongoose.Schema({
//   author: String,
//   comment: String,
//   date: {
//     type: String,
//     default: new Date(),
//   },
// });
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    default: new Date(),
  },
  author: String,
  comments: {
    type: Array,
    default: [],
  },
});

module.exports = mongoose.model("Post", postSchema);
