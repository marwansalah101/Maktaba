const { body, validationResult } = require('express-validator');

// Run after a rule chain — returns 422 with the first error message on failure.
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const first = errors.array()[0];
        return res.status(422).json({
            error: first.msg,
            errors: errors.array().map(e => ({ field: e.path, msg: e.msg })),
        });
    }
    next();
};

exports.validate = validate;

// ── Auth ─────────────────────────────────────────────────────────────────────

exports.signupRules = [
    body('name')
        .trim()
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters.')
        .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters.'),
    body('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email address.'),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
];

exports.loginRules = [
    body('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email address.'),
    body('password')
        .notEmpty().withMessage('Password is required.'),
];

// ── Books ─────────────────────────────────────────────────────────────────────

exports.bookRules = [
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('author').trim().notEmpty().withMessage('Author is required.'),
    body('genre').trim().notEmpty().withMessage('Genre is required.'),
    body('description').trim().notEmpty().withMessage('Description is required.'),
    body('image').trim().notEmpty().withMessage('Image URL is required.'),
    body('ISBN').trim().notEmpty().withMessage('ISBN is required.'),
    body('year')
        .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
        .withMessage('Year must be a valid number.'),
    body('pages')
        .isInt({ min: 1 }).withMessage('Pages must be at least 1.'),
    body('price')
        .isFloat({ min: 0 }).withMessage('Price must be a non-negative number.'),
    body('salePercent')
        .optional({ nullable: true })
        .isFloat({ min: 0, max: 100 }).withMessage('Sale percent must be between 0 and 100.'),
    body('salePrice')
        .optional({ nullable: true })
        .isFloat({ min: 0 }).withMessage('Sale price must be non-negative.'),
    body('stock')
        .optional({ nullable: true })
        .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer.'),
];

// ── Reviews ───────────────────────────────────────────────────────────────────

exports.reviewRules = [
    body('rating')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.'),
    body('reviewer')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Reviewer name cannot exceed 100 characters.'),
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Comment cannot exceed 2000 characters.'),
];

// ── Authors ───────────────────────────────────────────────────────────────────

exports.authorRules = [
    body('name')
        .trim()
        .isLength({ min: 2 }).withMessage('Author name must be at least 2 characters.'),
    body('slug')
        .trim()
        .notEmpty().withMessage('Slug is required.')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must be lowercase alphanumeric with hyphens.'),
];

// ── Orders ────────────────────────────────────────────────────────────────────

exports.orderRules = [
    body('customerInfo.email')
        .trim()
        .isEmail().withMessage('A valid customer email is required.'),
    body('items')
        .isArray({ min: 1 }).withMessage('Order must contain at least one item.'),
    body('items.*.title')
        .notEmpty().withMessage('Each order item must have a title.'),
    body('items.*.price')
        .isFloat({ min: 0 }).withMessage('Each order item must have a valid price.'),
];
