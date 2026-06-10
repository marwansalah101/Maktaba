const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isMissing = (value) => value === undefined || value === null || value === '';

const getTargets = (source, fieldPath) => {
    const parts = String(fieldPath).split('.');

    const walk = (current, index, currentPath) => {
        if (index >= parts.length) {
            return [{ path: currentPath.join('.'), value: current }];
        }

        const key = parts[index];

        if (key === '*') {
            if (!Array.isArray(current)) {
                return [{ path: currentPath.concat('*').join('.'), value: undefined }];
            }

            return current.flatMap((item, itemIndex) =>
                walk(item, index + 1, currentPath.concat(String(itemIndex)))
            );
        }

        if (current === undefined || current === null) {
            return [{ path: currentPath.concat(key).join('.'), value: undefined }];
        }

        return walk(current[key], index + 1, currentPath.concat(key));
    };

    return walk(source, 0, []);
};

const buildRule = (fieldPath) => {
    const steps = [];

    const rule = (req, _res, next) => {
        req._validationErrors = req._validationErrors || [];
        const targets = getTargets(req.body || {}, fieldPath);

        for (const target of targets) {
            let value = target.value;
            let skip = false;

            for (const step of steps) {
                if (step.type === 'optional') {
                    if (isMissing(value) || (step.config?.nullable && value === null)) {
                        skip = true;
                        break;
                    }
                    continue;
                }

                if (step.type === 'trim') {
                    if (typeof value === 'string') {
                        value = value.trim();
                    }
                    continue;
                }

                const message = step.message || 'Invalid value.';

                if (step.type === 'notEmpty') {
                    const invalid =
                        isMissing(value) ||
                        (typeof value === 'string' && value.trim() === '') ||
                        (Array.isArray(value) && value.length === 0);
                    if (invalid) {
                        req._validationErrors.push({ path: target.path, msg: message });
                        break;
                    }
                    continue;
                }

                if (step.type === 'isEmail') {
                    if (!EMAIL_RX.test(String(value || '').trim())) {
                        req._validationErrors.push({ path: target.path, msg: message });
                        break;
                    }
                    continue;
                }

                if (step.type === 'isLength') {
                    const length = String(value || '').length;
                    const { min = 0, max = Number.POSITIVE_INFINITY } = step.options || {};
                    if (length < min || length > max) {
                        req._validationErrors.push({ path: target.path, msg: message });
                        break;
                    }
                    continue;
                }

                if (step.type === 'isInt') {
                    const normalized = String(value ?? '').trim();
                    if (!/^-?\d+$/.test(normalized)) {
                        req._validationErrors.push({ path: target.path, msg: message });
                        break;
                    }
                    const numeric = Number.parseInt(normalized, 10);
                    const { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = step.options || {};
                    if (numeric < min || numeric > max) {
                        req._validationErrors.push({ path: target.path, msg: message });
                        break;
                    }
                    continue;
                }

                if (step.type === 'isFloat') {
                    const normalized = String(value ?? '').trim();
                    if (normalized === '' || Number.isNaN(Number(normalized))) {
                        req._validationErrors.push({ path: target.path, msg: message });
                        break;
                    }
                    const numeric = Number(normalized);
                    const { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = step.options || {};
                    if (numeric < min || numeric > max) {
                        req._validationErrors.push({ path: target.path, msg: message });
                        break;
                    }
                    continue;
                }

                if (step.type === 'matches') {
                    if (!step.regex.test(String(value || ''))) {
                        req._validationErrors.push({ path: target.path, msg: message });
                        break;
                    }
                    continue;
                }

                if (step.type === 'isArray') {
                    const min = step.options?.min;
                    const invalid = !Array.isArray(value) || (typeof min === 'number' && value.length < min);
                    if (invalid) {
                        req._validationErrors.push({ path: target.path, msg: message });
                        break;
                    }
                }
            }

            if (skip) {
                continue;
            }
        }

        next();
    };

    rule.trim = () => {
        steps.push({ type: 'trim' });
        return rule;
    };

    rule.isLength = (options = {}) => {
        steps.push({ type: 'isLength', options });
        return rule;
    };

    rule.isEmail = () => {
        steps.push({ type: 'isEmail' });
        return rule;
    };

    rule.isInt = (options = {}) => {
        steps.push({ type: 'isInt', options });
        return rule;
    };

    rule.isFloat = (options = {}) => {
        steps.push({ type: 'isFloat', options });
        return rule;
    };

    rule.optional = (config = {}) => {
        steps.push({ type: 'optional', config });
        return rule;
    };

    rule.notEmpty = () => {
        steps.push({ type: 'notEmpty' });
        return rule;
    };

    rule.matches = (regex) => {
        steps.push({ type: 'matches', regex });
        return rule;
    };

    rule.isArray = (options = {}) => {
        steps.push({ type: 'isArray', options });
        return rule;
    };

    rule.withMessage = (message) => {
        if (steps.length > 0) {
            steps[steps.length - 1].message = message;
        }
        return rule;
    };

    return rule;
};

const collectErrors = (req) => {
    const errors = req._validationErrors || [];
    return {
        isEmpty: () => errors.length === 0,
        array: () => errors.slice(),
    };
};

const validate = (req, res, next) => {
    const errors = collectErrors(req);
    if (!errors.isEmpty()) {
        const first = errors.array()[0];
        return res.status(422).json({
            error: first.msg,
            errors: errors.array().map((entry) => ({ field: entry.path, msg: entry.msg })),
        });
    }

    next();
};

exports.validate = validate;

// Auth
exports.signupRules = [
    buildRule('name')
        .trim()
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters.')
        .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters.'),
    buildRule('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email address.'),
    buildRule('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
];

exports.loginRules = [
    buildRule('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email address.'),
    buildRule('password')
        .notEmpty().withMessage('Password is required.'),
];

// Books
exports.bookRules = [
    buildRule('title').trim().notEmpty().withMessage('Title is required.'),
    buildRule('author').trim().notEmpty().withMessage('Author is required.'),
    buildRule('genre').trim().notEmpty().withMessage('Genre is required.'),
    buildRule('description').trim().notEmpty().withMessage('Description is required.'),
    buildRule('image').trim().notEmpty().withMessage('Image URL is required.'),
    buildRule('ISBN').trim().notEmpty().withMessage('ISBN is required.'),
    buildRule('year')
        .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
        .withMessage('Year must be a valid number.'),
    buildRule('pages')
        .isInt({ min: 1 }).withMessage('Pages must be at least 1.'),
    buildRule('price')
        .isFloat({ min: 0 }).withMessage('Price must be a non-negative number.'),
    buildRule('salePercent')
        .optional({ nullable: true })
        .isFloat({ min: 0, max: 100 }).withMessage('Sale percent must be between 0 and 100.'),
    buildRule('salePrice')
        .optional({ nullable: true })
        .isFloat({ min: 0 }).withMessage('Sale price must be non-negative.'),
    buildRule('stock')
        .optional({ nullable: true })
        .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer.'),
];

// Reviews
exports.reviewRules = [
    buildRule('rating')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.'),
    buildRule('reviewer')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Reviewer name cannot exceed 100 characters.'),
    buildRule('comment')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Comment cannot exceed 2000 characters.'),
];

// Authors
exports.authorRules = [
    buildRule('name')
        .trim()
        .isLength({ min: 2 }).withMessage('Author name must be at least 2 characters.'),
    buildRule('slug')
        .trim()
        .notEmpty().withMessage('Slug is required.')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must be lowercase alphanumeric with hyphens.'),
];

// Orders
exports.orderRules = [
    buildRule('customerInfo.email')
        .trim()
        .isEmail().withMessage('A valid customer email is required.'),
    buildRule('items')
        .isArray({ min: 1 }).withMessage('Order must contain at least one item.'),
    buildRule('items.*.title')
        .notEmpty().withMessage('Each order item must have a title.'),
    buildRule('items.*.price')
        .isFloat({ min: 0 }).withMessage('Each order item must have a valid price.'),
];
