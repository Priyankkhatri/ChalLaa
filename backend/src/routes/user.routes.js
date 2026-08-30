const express = require('express');
const router = express.Router();
const { getMe, updateProfile } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/me', getMe);
router.put('/me', updateProfile);

module.exports = router;
