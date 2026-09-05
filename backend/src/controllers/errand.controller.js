const Errand = require('../models/Errand');

// @desc    Post a new errand
// @route   POST /api/errands
// @access  Private
const createErrand = async (req, res, next) => {
  try {
    const { title, description, category, budget, latitude, longitude, address, location } = req.body;

    const lat = latitude !== undefined && latitude !== null
      ? parseFloat(latitude)
      : (location?.coordinates && location.coordinates[1] !== undefined
          ? parseFloat(location.coordinates[1])
          : undefined);

    const lng = longitude !== undefined && longitude !== null
      ? parseFloat(longitude)
      : (location?.coordinates && location.coordinates[0] !== undefined
          ? parseFloat(location.coordinates[0])
          : undefined);

    if (!title || lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide errand title and valid GPS coordinates (latitude, longitude)',
      });
    }

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude values',
      });
    }

    const errand = new Errand({
      requesterId: req.user._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category || 'other',
      budget: Number(budget) || 0,
      location: {
        type: 'Point',
        coordinates: [lng, lat], // GeoJSON order: [longitude, latitude]
      },
      address: address ? address.trim() : '',
      status: 'posted',
      statusHistory: [
        {
          status: 'posted',
          timestamp: new Date(),
          updatedBy: req.user._id,
        },
      ],
    });

    await errand.save();
    await errand.populate('requesterId', 'name email phone hostelOrCollegeId karmaScore isVerified avatarUrl');

    res.status(201).json({
      success: true,
      message: 'Errand posted successfully',
      errand,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby posted errands using 2dsphere geofence
// @route   GET /api/errands/nearby?lat=&lng=&radius=&category=
// @access  Private
const getNearbyErrands = async (req, res, next) => {
  try {
    const { lat, lng, radius = 2, category, search, page = 1, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Current latitude and longitude are required to discover nearby errands',
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius) || 2;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Earth radius in kilometers ~ 6378.1
    const earthRadiusKm = 6378.1;
    const radiusInRadians = radiusKm / earthRadiusKm;

    const query = {
      status: 'posted',
      // Optional: exclude user's own errands if desired, but showing all posted nearby is standard
      location: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInRadians],
        },
      },
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { address: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const [errands, total] = await Promise.all([
      Errand.find(query)
        .populate('requesterId', 'name phone hostelOrCollegeId karmaScore isVerified avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Errand.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: errands.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      radiusKm,
      errands,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my errands (posted by me and accepted by me)
// @route   GET /api/errands/mine?role=
// @access  Private
const getMyErrands = async (req, res, next) => {
  try {
    const { role = 'all', status } = req.query;
    const userId = req.user._id;

    let filter = {};

    if (role === 'posted') {
      filter.requesterId = userId;
    } else if (role === 'accepted') {
      filter.runnerId = userId;
    } else {
      filter.$or = [{ requesterId: userId }, { runnerId: userId }];
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const errands = await Errand.find(filter)
      .populate('requesterId', 'name phone hostelOrCollegeId karmaScore isVerified avatarUrl')
      .populate('runnerId', 'name phone hostelOrCollegeId karmaScore isVerified avatarUrl')
      .sort({ updatedAt: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: errands.length,
      errands,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single errand details
// @route   GET /api/errands/:id
// @access  Private
const getErrandById = async (req, res, next) => {
  try {
    const errand = await Errand.findById(req.params.id)
      .populate('requesterId', 'name email phone hostelOrCollegeId karmaScore isVerified avatarUrl')
      .populate('runnerId', 'name email phone hostelOrCollegeId karmaScore isVerified avatarUrl')
      .populate('statusHistory.updatedBy', 'name');

    if (!errand) {
      return res.status(404).json({
        success: false,
        message: 'Errand not found',
      });
    }

    res.status(200).json({
      success: true,
      errand,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept an errand (Runner takes errand)
// @route   PATCH /api/errands/:id/accept
// @access  Private
const acceptErrand = async (req, res, next) => {
  try {
    const errand = await Errand.findById(req.params.id);

    if (!errand) {
      return res.status(404).json({
        success: false,
        message: 'Errand not found',
      });
    }

    if (errand.status !== 'posted') {
      return res.status(400).json({
        success: false,
        message: `Errand cannot be accepted because it is already ${errand.status}`,
      });
    }

    if (errand.requesterId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot accept your own errand',
      });
    }

    errand.runnerId = req.user._id;
    errand.status = 'accepted';
    errand.statusHistory.push({
      status: 'accepted',
      timestamp: new Date(),
      updatedBy: req.user._id,
    });

    await errand.save();
    await errand.populate('requesterId', 'name phone hostelOrCollegeId karmaScore isVerified avatarUrl');
    await errand.populate('runnerId', 'name phone hostelOrCollegeId karmaScore isVerified avatarUrl');

    res.status(200).json({
      success: true,
      message: 'Errand accepted! You are now the runner for this task.',
      errand,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update errand lifecycle status (in_progress, delivered, cancelled)
// @route   PATCH /api/errands/:id/status
// @access  Private
const updateErrandStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // If status is 'accepted', delegate to acceptErrand
    if (status === 'accepted') {
      return acceptErrand(req, res, next);
    }

    const allowedStatuses = ['in_progress', 'delivered', 'cancelled'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const errand = await Errand.findById(req.params.id);
    if (!errand) {
      return res.status(404).json({
        success: false,
        message: 'Errand not found',
      });
    }

    const isRequester = errand.requesterId.toString() === req.user._id.toString();
    const isRunner = errand.runnerId && errand.runnerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isRequester && !isRunner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this errand status',
      });
    }

    // State machine checks
    if (status === 'in_progress') {
      if (!isRunner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only the assigned runner can start an errand',
        });
      }
      if (errand.status !== 'accepted') {
        return res.status(400).json({
          success: false,
          message: `Cannot start errand from status '${errand.status}'`,
        });
      }
    }

    if (status === 'delivered') {
      if (errand.status !== 'in_progress' && errand.status !== 'accepted') {
        return res.status(400).json({
          success: false,
          message: `Cannot mark errand delivered from status '${errand.status}'`,
        });
      }
    }

    if (status === 'cancelled') {
      if (errand.status === 'delivered') {
        return res.status(400).json({
          success: false,
          message: 'Completed/delivered errands cannot be cancelled',
        });
      }
    }

    errand.status = status;
    errand.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });

    await errand.save();
    await errand.populate('requesterId', 'name phone hostelOrCollegeId karmaScore isVerified avatarUrl');
    await errand.populate('runnerId', 'name phone hostelOrCollegeId karmaScore isVerified avatarUrl');

    res.status(200).json({
      success: true,
      message: `Errand status updated to ${status}`,
      errand,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload proof of purchase / delivery photo
// @route   POST /api/errands/:id/proof
// @access  Private
const uploadProofImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file',
      });
    }

    const errand = await Errand.findById(req.params.id);
    if (!errand) {
      return res.status(404).json({
        success: false,
        message: 'Errand not found',
      });
    }

    const isRequester = errand.requesterId.toString() === req.user._id.toString();
    const isRunner = errand.runnerId && errand.runnerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isRequester && !isRunner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload proof for this errand',
      });
    }

    // Relative URL path to served file
    const imageUrl = `/uploads/${req.file.filename}`;
    errand.proofImages.push(imageUrl);
    await errand.save();

    await errand.populate('requesterId', 'name phone hostelOrCollegeId karmaScore isVerified avatarUrl');
    await errand.populate('runnerId', 'name phone hostelOrCollegeId karmaScore isVerified avatarUrl');

    res.status(200).json({
      success: true,
      message: 'Proof photo uploaded successfully',
      imageUrl,
      errand,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createErrand,
  getNearbyErrands,
  getMyErrands,
  getErrandById,
  acceptErrand,
  updateErrandStatus,
  uploadProofImage,
};
