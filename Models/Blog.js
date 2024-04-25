const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: true,
    },
    heading: {
      type: String,
      required: true,
    },
    body: {
        type: String,
        required: true,
      },
  },
  { timestamps: true }
);

const Blog = mongoose.model('Blog', blogSchema);



module.exports = { Blog };

