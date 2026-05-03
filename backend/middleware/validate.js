/**
 * Centralized validation middleware using express-validator.
 *
 * handleValidationErrors: runs after validator chains — returns 400
 * with structured error messages if any validation failed.
 */

const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return the first error message for a clean UX, plus full array for debugging
    const firstMsg = errors.array()[0].msg;
    return res.status(400).json({
      message: firstMsg,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { handleValidationErrors };
