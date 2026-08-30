const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    errandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Errand',
      required: [true, 'Errand ID is required'],
      index: true,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'From User ID is required'],
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'To User ID is required'],
    },
    score: {
      type: Number,
      required: [true, 'Rating score is required'],
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple ratings from the same user on the same errand
ratingSchema.index({ errandId: 1, fromUserId: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
