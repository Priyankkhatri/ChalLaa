const express = require('express');
const router = express.Router();
const {
  createErrand,
  getNearbyErrands,
  getMyErrands,
  getErrandById,
  acceptErrand,
  updateErrandStatus,
} = require('../controllers/errand.controller');
const { protect } = require('../middleware/auth.middleware');

// All errand endpoints require authentication
router.use(protect);

router.post('/', createErrand);
router.get('/nearby', getNearbyErrands);
router.get('/mine', getMyErrands);
router.get('/:id', getErrandById);
router.patch('/:id/accept', acceptErrand);
router.patch('/:id/status', updateErrandStatus);

module.exports = router;
