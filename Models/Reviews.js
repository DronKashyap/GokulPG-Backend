const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Reviews = mongoose.model('Reviews', reviewSchema);



module.exports = { Reviews };

