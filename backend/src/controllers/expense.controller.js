const Transaction = require('../models/Transaction');
const Errand = require('../models/Errand');

// @desc    Log an expense against an errand
// @route   POST /api/expenses
// @access  Private
const logExpense = async (req, res, next) => {
  try {
    const { errandId, amount, notes, receiptImageUrl } = req.body;

    if (!errandId || amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid errand ID and expense amount greater than 0',
      });
    }

    const errand = await Errand.findById(errandId);
    if (!errand) {
      return res.status(404).json({
        success: false,
        message: 'Errand not found',
      });
    }

    const transaction = new Transaction({
      errandId,
      paidBy: req.user._id,
      amount: Number(amount),
      notes: notes ? notes.trim() : '',
      receiptImageUrl: receiptImageUrl || '',
      status: 'pending',
    });

    await transaction.save();
    await transaction.populate('paidBy', 'name email phone avatarUrl');

    res.status(201).json({
      success: true,
      message: 'Expense logged successfully',
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expenses logged for an errand
// @route   GET /api/expenses/errand/:errandId
// @access  Private
const getErrandExpenses = async (req, res, next) => {
  try {
    const { errandId } = req.params;

    const transactions = await Transaction.find({ errandId })
      .populate('paidBy', 'name phone avatarUrl')
      .sort({ createdAt: -1 });

    const totalAmount = transactions.reduce((acc, curr) => acc + curr.amount, 0);
    const pendingAmount = transactions
      .filter((t) => t.status === 'pending')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const settledAmount = transactions
      .filter((t) => t.status === 'settled')
      .reduce((acc, curr) => acc + curr.amount, 0);

    res.status(200).json({
      success: true,
      count: transactions.length,
      totalAmount,
      pendingAmount,
      settledAmount,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Settle an expense (requester reimburses runner)
// @route   PATCH /api/expenses/:id/settle
// @access  Private
const settleExpense = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const errand = await Errand.findById(transaction.errandId);
    if (!errand) {
      return res.status(404).json({
        success: false,
        message: 'Associated errand not found',
      });
    }

    const isRequester = errand.requesterId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isRequester && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the errand requester or admin can confirm reimbursement',
      });
    }

    transaction.status = 'settled';
    transaction.settledAt = new Date();
    await transaction.save();
    await transaction.populate('paidBy', 'name phone avatarUrl');

    res.status(200).json({
      success: true,
      message: 'Expense marked as settled and reimbursed!',
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get running balance summary for current user
// @route   GET /api/expenses/summary
// @access  Private
const getUserBalanceSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Expenses where I paid (Runner spent money)
    const paidByMe = await Transaction.find({ paidBy: userId });
    const totalSpentByMe = paidByMe.reduce((sum, t) => sum + t.amount, 0);
    const pendingReimbursementToMe = paidByMe
      .filter((t) => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    // Errands where I was the requester
    const myRequestedErrands = await Errand.find({ requesterId: userId }).select('_id');
    const errandIds = myRequestedErrands.map((e) => e._id);

    // Expenses on my errands where someone else paid
    const owedByMe = await Transaction.find({
      errandId: { $in: errandIds },
      paidBy: { $ne: userId },
    });
    const totalOwedByMe = owedByMe.reduce((sum, t) => sum + t.amount, 0);
    const pendingOwedByMe = owedByMe
      .filter((t) => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      success: true,
      summary: {
        totalSpentByMe,
        pendingReimbursementToMe,
        totalOwedByMe,
        pendingOwedByMe,
        netRunningBalance: totalSpentByMe - totalOwedByMe,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  logExpense,
  getErrandExpenses,
  settleExpense,
  getUserBalanceSummary,
};
