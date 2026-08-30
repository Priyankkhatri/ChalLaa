const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    errandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Errand',
      required: [true, 'Errand ID is required'],
      index: true,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Paid By user ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0, 'Amount must be greater than 0'],
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    receiptImageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'settled'],
      default: 'pending',
    },
    settledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
