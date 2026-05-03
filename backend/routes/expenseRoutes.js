const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');
const { sendBudgetAlert } = require('../config/mailer');

// GET all expenses for a trip
router.get('/:tripId', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({ trip: req.params.tripId, user: req.user._id });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST add expense to trip
router.post('/:tripId', protect, [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title must be less than 100 characters'),
  body('amount').isNumeric().withMessage('Amount must be a number').custom(value => value > 0).withMessage('Amount must be greater than 0'),
  body('category').optional().isIn(['Food', 'Transport', 'Hotel', 'Activities', 'Shopping', 'Other']).withMessage('Invalid category'),
  body('date').optional().isISO8601().toDate().withMessage('Invalid date format'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    
    // Atomic increment to prevent race conditions
    const trip = await Trip.findByIdAndUpdate(
      req.params.tripId,
      { $inc: { totalExpense: Number(amount) } },
      { new: true }
    );
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const expense = await Expense.create({
      trip: req.params.tripId,
      user: req.user._id,
      title, amount, category, date
    });

    let budgetExceeded = trip.budgetExceeded;

    // Check budget
    if (trip.totalExpense >= trip.budget && !budgetExceeded) {
      budgetExceeded = true;
      await Trip.findByIdAndUpdate(
        req.params.tripId,
        { budgetExceeded: true }
      );

      // Send email only ONCE when first exceeded
      const user = await User.findById(req.user._id);
      if (user && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        sendBudgetAlert(
          user.email,
          user.name,
          trip.name,
          trip.budget,
          trip.totalExpense
        );
      }
    }

    res.status(201).json({
      expense,
      budgetExceeded,
      totalExpense: trip.totalExpense,
      budget: trip.budget
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT edit expense
router.put('/:expenseId', protect, [
  body('title').optional().trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title must be less than 100 characters'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number').custom(value => value > 0).withMessage('Amount must be greater than 0'),
  body('category').optional().isIn(['Food', 'Transport', 'Hotel', 'Activities', 'Shopping', 'Other']).withMessage('Invalid category'),
  body('date').optional().isISO8601().toDate().withMessage('Invalid date format'),
  handleValidationErrors
], async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    if (expense.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { title, amount, category, date } = req.body;
    let amountDiff = 0;

    if (amount !== undefined && amount !== expense.amount) {
      amountDiff = Number(amount) - expense.amount;
      expense.amount = Number(amount);
    }

    if (title !== undefined) expense.title = title;
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = date;

    await expense.save();

    if (amountDiff !== 0) {
      const trip = await Trip.findByIdAndUpdate(
        expense.trip,
        { $inc: { totalExpense: amountDiff } },
        { new: true }
      );

      if (trip) {
        if (trip.totalExpense >= trip.budget && !trip.budgetExceeded) {
          await Trip.findByIdAndUpdate(expense.trip, { budgetExceeded: true });
          const user = await User.findById(req.user._id);
          if (user && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            sendBudgetAlert(user.email, user.name, trip.name, trip.budget, trip.totalExpense);
          }
        } else if (trip.totalExpense < trip.budget && trip.budgetExceeded) {
          await Trip.findByIdAndUpdate(expense.trip, { budgetExceeded: false });
        }
      }
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE expense
router.delete('/:expenseId', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    if (expense.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const trip = await Trip.findByIdAndUpdate(
      expense.trip,
      { $inc: { totalExpense: -expense.amount } },
      { new: true }
    );

    if (trip) {
      if (trip.totalExpense < trip.budget && trip.budgetExceeded) {
        await Trip.findByIdAndUpdate(expense.trip, { budgetExceeded: false });
      }
      if (trip.totalExpense < 0) {
        await Trip.findByIdAndUpdate(expense.trip, { totalExpense: 0 });
      }
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;