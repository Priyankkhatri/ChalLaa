const Message = require('../models/Message');
const Errand = require('../models/Errand');

// @desc    Get chat message history for an errand
// @route   GET /api/errands/:id/messages
// @access  Private
const getErrandMessages = async (req, res, next) => {
  try {
    const errandId = req.params.id;

    const errand = await Errand.findById(errandId);
    if (!errand) {
      return res.status(404).json({
        success: false,
        message: 'Errand not found',
      });
    }

    // Verify user is either requester or runner or admin
    const userId = req.user._id.toString();
    const isRequester = errand.requesterId.toString() === userId;
    const isRunner = errand.runnerId && errand.runnerId.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isRequester && !isRunner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages for this errand',
      });
    }

    const messages = await Message.find({ errandId })
      .populate('senderId', 'name avatarUrl karmaScore')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getErrandMessages,
};
