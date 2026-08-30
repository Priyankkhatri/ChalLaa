const express = require('express');
const router = express.Router();
const {
  logExpense,
  getErrandExpenses,
  settleExpense,
  getUserBalanceSummary,
} = require('../controllers/expense.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', logExpense);
router.get('/errand/:errandId', getErrandExpenses);
router.patch('/:id/settle', settleExpense);
router.get('/summary', getUserBalanceSummary);

module.exports = router;
