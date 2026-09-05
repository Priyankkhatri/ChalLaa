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
const { getErrandMessages, sendErrandMessage } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// All errand endpoints require authentication
router.use(protect);

router.post('/', createErrand);
router.get('/nearby', getNearbyErrands);
router.get('/mine', getMyErrands);
router.get('/:id', getErrandById);
router.get('/:id/messages', getErrandMessages);
router.post('/:id/messages', sendErrandMessage);
router.patch('/:id/accept', acceptErrand);
router.patch('/:id/status', updateErrandStatus);
router.post(
  '/:id/proof',
  (req, res, next) => {
    upload.fields([
      { name: 'proof', maxCount: 1 },
      { name: 'proofPhoto', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) return next(err);
      if (req.files?.proofPhoto?.[0] && !req.file) {
        req.file = req.files.proofPhoto[0];
      } else if (req.files?.proof?.[0] && !req.file) {
        req.file = req.files.proof[0];
      }
      next();
    });
  },
  uploadProofImage
);

module.exports = router;
