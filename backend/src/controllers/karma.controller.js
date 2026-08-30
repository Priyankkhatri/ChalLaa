const Rating = require('../models/Rating');
const Dispute = require('../models/Dispute');
const Errand = require('../models/Errand');
const User = require('../models/User');

// @desc    Submit rating and update peer karma score
// @route   POST /api/karma/rate
// @access  Private
const submitRating = async (req, res, next) => {
  try {
    const { errandId, score, feedback } = req.body;

    if (!errandId || score === undefined || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid errand ID and rating score between 1 and 5',
      });
    }

    const errand = await Errand.findById(errandId);
    if (!errand) {
      return res.status(404).json({
        success: false,
        message: 'Errand not found',
      });
    }

    const isRequester = errand.requesterId.toString() === req.user._id.toString();
    const isRunner = errand.runnerId && errand.runnerId.toString() === req.user._id.toString();

    if (!isRequester && !isRunner) {
      return res.status(403).json({
        success: false,
        message: 'Only participants of this errand can submit ratings',
      });
    }

    const toUserId = isRequester ? errand.runnerId : errand.requesterId;
    if (!toUserId) {
      return res.status(400).json({
        success: false,
        message: 'No peer runner assigned to rate on this errand',
      });
    }

    // Check if already rated
    const existingRating = await Rating.findOne({
      errandId,
      fromUserId: req.user._id,
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a rating for this errand',
      });
    }

    const rating = new Rating({
      errandId,
      fromUserId: req.user._id,
      toUserId,
      score: Number(score),
      feedback: feedback ? feedback.trim() : '',
    });

    await rating.save();

    // Adjust peer karma score based on rating
    const targetUser = await User.findById(toUserId);
    if (targetUser) {
      let deltaKarma = 0;
      if (score >= 4) deltaKarma = 5;
      else if (score === 3) deltaKarma = 1;
      else if (score <= 2) deltaKarma = -5;

      targetUser.karmaScore = Math.max(0, Math.min(1000, targetUser.karmaScore + deltaKarma));
      await targetUser.save();
    }

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully!',
      rating,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    File a dispute on an errand
// @route   POST /api/karma/dispute
// @access  Private
const fileDispute = async (req, res, next) => {
  try {
    const { errandId, reason, description } = req.body;

    if (!errandId || !reason || !description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide errand ID, dispute reason, and detailed description',
      });
    }

    const errand = await Errand.findById(errandId);
    if (!errand) {
      return res.status(404).json({
        success: false,
        message: 'Errand not found',
      });
    }

    const isRequester = errand.requesterId.toString() === req.user._id.toString();
    const isRunner = errand.runnerId && errand.runnerId.toString() === req.user._id.toString();

    if (!isRequester && !isRunner) {
      return res.status(403).json({
        success: false,
        message: 'Only participants of this errand can file a dispute',
      });
    }

    const againstUser = isRequester ? errand.runnerId : errand.requesterId;
    if (!againstUser) {
      return res.status(400).json({
        success: false,
        message: 'No peer runner assigned to dispute on this errand',
      });
    }

    const dispute = new Dispute({
      errandId,
      reportedBy: req.user._id,
      againstUser,
      reason,
      description: description.trim(),
      status: 'open',
    });

    await dispute.save();

    res.status(201).json({
      success: true,
      message: 'Dispute reported. Campus moderators will review within 24 hours.',
      dispute,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get rating status for an errand
// @route   GET /api/karma/errand/:errandId/status
// @access  Private
const getErrandRatingStatus = async (req, res, next) => {
  try {
    const { errandId } = req.params;

    const myRating = await Rating.findOne({
      errandId,
      fromUserId: req.user._id,
    });

    const allRatings = await Rating.find({ errandId })
      .populate('fromUserId', 'name avatarUrl')
      .populate('toUserId', 'name avatarUrl');

    res.status(200).json({
      success: true,
      hasRated: !!myRating,
      myRating,
      allRatings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitRating,
  fileDispute,
  getErrandRatingStatus,
};
