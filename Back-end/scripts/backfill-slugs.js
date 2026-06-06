/* ──────────────────────────────────────────────────────────────
   backfill-slugs.js — one-off migration (idempotent)
   Populates the `slug` field on Book documents created before the
   slug field existed (note §2.3). Safe to run multiple times: only
   touches documents whose slug is missing or empty.

   Run from Back-end/:  npm run migrate:slugs
────────────────────────────────────────────────────────────── */
const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Book     = require('../models/Book');

function toSlug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const books = await Book.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] });
        console.log(`Found ${books.length} book(s) without a slug.`);

        let updated = 0;
        for (const book of books) {
            book.slug = toSlug(book.title);
            await book.save();
            updated++;
        }

        console.log(`✅ Backfilled slug on ${updated} book(s).`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Slug backfill failed:', err.message);
        process.exit(1);
    }
})();
