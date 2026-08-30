const express = require('express');
const router = express.Router();
const {
  createErrand,
  getNearbyErrands,
  getMyErrands,
  getErrandById,
  acceptErrand,
  updateErrandStatus,
  uploadProofImage,
} = require('../controllers/errand.controller');
const { getErrandMessages } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// All errand endpoints require authentication
router.use(protect);

router.post('/', createErrand);
router.get('/nearby', getNearbyErrands);
router.get('/mine', getMyErrands);
router.get('/:id', getErrandById);
router.get('/:id/messages', getErrandMessages);
router.patch('/:id/accept', acceptErrand);
router.patch('/:id/status', updateErrandStatus);
router.post('/:id/proof', upload.single('proof'), uploadProofImage);

module.exports = router;
