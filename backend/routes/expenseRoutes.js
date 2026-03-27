const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { sendBudgetAlert } = require('../config/mailer');

// GET all expenses for a trip
router.get('/:tripId', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({ trip: req.params.tripId });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST add expense to trip
router.post('/:tripId', protect, async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const expense = await Expense.create({
      trip: req.params.tripId,
      user: req.user._id,
      title, amount, category, date
    });

    const wasExceeded = trip.budgetExceeded;
    trip.totalExpense += Number(amount);

    // Check budget
    if (trip.totalExpense >= trip.budget) {
      trip.budgetExceeded = true;

      // Send email only ONCE when first exceeded
      if (!wasExceeded) {
        const user = await User.findById(req.user._id);
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          sendBudgetAlert(
            user.email,
            user.name,
            trip.name,
            trip.budget,
            trip.totalExpense
          );
        }
      }
    }

    await trip.save();

    res.status(201).json({
      expense,
      budgetExceeded: trip.budgetExceeded,
      totalExpense: trip.totalExpense,
      budget: trip.budget
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE expense
router.delete('/:expenseId', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const trip = await Trip.findById(expense.trip);
    if (trip) {
      trip.totalExpense = Math.max(0, trip.totalExpense - expense.amount);
      if (trip.totalExpense < trip.budget) trip.budgetExceeded = false;
      await trip.save();
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;