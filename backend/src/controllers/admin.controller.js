const User = require('../models/User');
const Errand = require('../models/Errand');
const Dispute = require('../models/Dispute');
const Transaction = require('../models/Transaction');

// @desc    Get aggregate platform statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    const totalErrands = await Errand.countDocuments();
    const activeErrands = await Errand.countDocuments({ status: { $in: ['posted', 'accepted', 'in_progress'] } });
    const completedErrands = await Errand.countDocuments({ status: 'delivered' });
    const cancelledErrands = await Errand.countDocuments({ status: 'cancelled' });

    const openDisputes = await Dispute.countDocuments({ status: { $in: ['open', 'in_review'] } });
    const totalTransactions = await Transaction.countDocuments();

    const transactions = await Transaction.find({ status: 'settled' });
    const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        totalErrands,
        activeErrands,
        completedErrands,
        cancelledErrands,
        openDisputes,
        totalTransactions,
        totalVolume,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with search
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, isVerified } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { hostelOrCollegeId: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }

    const users = await User.find(query)
      .select('-passwordHash -refreshToken')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user student verification
// @route   PATCH /api/admin/users/:id/verify
// @access  Private/Admin
const toggleUserVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isVerified = !user.isVerified;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User is now ${user.isVerified ? 'VERIFIED' : 'UNVERIFIED'}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all platform disputes
// @route   GET /api/admin/disputes
// @access  Private/Admin
const getAllDisputes = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const disputes = await Dispute.find(query)
      .populate('reportedBy', 'name email phone avatarUrl karmaScore')
      .populate('againstUser', 'name email phone avatarUrl karmaScore')
      .populate('errandId', 'title budget category status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: disputes.length,
      disputes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve or dismiss dispute
// @route   PATCH /api/admin/disputes/:id/resolve
// @access  Private/Admin
const resolveDispute = async (req, res, next) => {
  try {
    const { status, adminNotes, karmaPenalty } = req.body;
    const allowed = ['resolved', 'dismissed', 'in_review'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(', ')}`,
      });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found',
      });
    }

    dispute.status = status;
    dispute.adminNotes = adminNotes ? adminNotes.trim() : dispute.adminNotes;
    await dispute.save();

    // Optionally apply karma penalty to reported user if found guilty
    if (karmaPenalty && Number(karmaPenalty) > 0 && status === 'resolved') {
      const targetUser = await User.findById(dispute.againstUser);
      if (targetUser) {
        targetUser.karmaScore = Math.max(0, targetUser.karmaScore - Number(karmaPenalty));
        await targetUser.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Dispute status updated to ${status}`,
      dispute,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all platform errands for admin moderation
// @route   GET /api/admin/errands
// @access  Private/Admin
const getAllErrandsAdmin = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;

    const errands = await Errand.find(query)
      .populate('requesterId', 'name email phone karmaScore')
      .populate('runnerId', 'name email phone karmaScore')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: errands.length,
      errands,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  toggleUserVerification,
  getAllDisputes,
  resolveDispute,
  getAllErrandsAdmin,
};
