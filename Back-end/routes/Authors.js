const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router  = express.Router();
const authors = require('../controllers/authorController');
const { protect, adminOnly } = require('../middlewares/auth');
const { authorRules, validate } = require('../middlewares/validators');

const uploadPath = path.join(__dirname, '..', 'uploads', 'authors');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `profile-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const ALLOWED_IMG_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for profile images.'));
    }
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_IMG_EXTS.includes(ext)) {
      return cb(new Error(`Unsupported image format. Allowed: ${ALLOWED_IMG_EXTS.join(', ')}`));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get('/',                   authors.getAllAuthors);
router.get('/slug/:slug',         authors.getAuthorBySlug);
router.get('/slug/:slug/books',   authors.getBooksByAuthorSlug);
router.get('/:id',                authors.getAuthorById);
router.post('/',                  protect, adminOnly, upload.single('profileImg'), authorRules, validate, authors.createAuthor);
router.put('/:id',                protect, adminOnly, authors.updateAuthor);
router.delete('/:id',             protect, adminOnly, authors.deleteAuthor);

module.exports = router;
