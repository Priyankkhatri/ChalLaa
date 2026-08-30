const mongoose = require('mongoose');

const errandSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester ID is required'],
    },
    runnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Errand title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      enum: ['grocery', 'food', 'medicine', 'courier', 'stationery', 'laundry', 'other'],
      default: 'other',
    },
    budget: {
      type: Number,
      default: 0,
      min: [0, 'Budget cannot be negative'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Coordinates [longitude, latitude] are required'],
      },
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['posted', 'accepted', 'in_progress', 'delivered', 'cancelled'],
      default: 'posted',
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    proofImages: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// 2dsphere geospatial index for proximity queries
errandSchema.index({ location: '2dsphere' });

const Errand = mongoose.model('Errand', errandSchema);

module.exports = Errand;
