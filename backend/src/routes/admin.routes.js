const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  toggleUserVerification,
  getAllDisputes,
  resolveDispute,
  getAllErrandsAdmin,
} = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// All admin routes require authenticated Admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/verify', toggleUserVerification);
router.get('/disputes', getAllDisputes);
router.patch('/disputes/:id/resolve', resolveDispute);
router.get('/errands', getAllErrandsAdmin);

module.exports = router;
