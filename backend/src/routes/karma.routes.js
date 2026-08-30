const express = require('express');
const router = express.Router();
const {
  submitRating,
  fileDispute,
  getErrandRatingStatus,
} = require('../controllers/karma.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/rate', submitRating);
router.post('/dispute', fileDispute);
router.get('/errand/:errandId/status', getErrandRatingStatus);

module.exports = router;
