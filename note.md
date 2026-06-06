# Mactaba — Industry Standards Review Notes

**Project:** Full-stack e-commerce bookstore (Node/Express + MongoDB + Vanilla JS)  
**Date reviewed:** 2026-06-01

---

## 1. CRITICAL SECURITY ISSUES

### 1.1 Book write routes have zero authentication
`Back-end/routes/books.js` lines 11–13 — `POST /books`, `PUT /books/title/:title`, and `DELETE /books/title/:title` have no `protect` or `adminOnly` middleware. Any anonymous user on the internet can create, modify, or delete any book in the database right now. Must add `protect, adminOnly` to all three.

### 1.2 All order routes have no authentication
`Back-end/routes/Order.js` — every route (`GET /`, `GET /customer/:email`, `GET /order/:orderNumber`, `PUT /:orderNumber/status`, `PUT /:orderNumber/payment`, `DELETE /:orderNumber`) runs with no auth middleware.
- `GET /` exposes every customer's order to anyone.
- `GET /customer/:email` is an IDOR: pass any email address and read that person's full order history.
- `PUT` and `DELETE` let anyone cancel orders or mark payments complete.

### 1.3 Plaintext admin password comparison still in production code
`Back-end/controllers/authController.js` lines 94–98 — the fallback branch compares `password === adminPassword` as a raw string. bcrypt is bypassed entirely for the admin account. Remove this fallback entirely and seed a real admin user with a hashed password.

### 1.4 `sanitize.js` was created but never wired up
`Back-end/utils/sanitize.js` defines `stripHtml()` but no controller imports it. Stored XSS is still possible on every free-text field (book descriptions, review comments, author bios). Either import and apply it in every `create`/`update` controller, or use the `express-validator` `escape()` sanitizer.

### 1.5 Content Security Policy is permanently disabled
`Back-end/app.js` line 14–18 disables Helmet's CSP, crossOriginOpenerPolicy, and crossOriginResourcePolicy with a comment "configure before production." The reason given is inline `<script>` tags across frontend pages. The correct fix is to move inline scripts to external files and enable CSP — not to ship to production without it.

### 1.6 CORS is fully open
`app.use(cors())` with no `origin` option accepts requests from any domain. This should be locked to the production frontend domain(s) in production, e.g. `cors({ origin: process.env.ALLOWED_ORIGIN })`.

### 1.7 No dedicated rate limiting on auth endpoints
Login and signup share the same `300 req / 15 min` limiter applied to all `/api` routes. Brute-force and credential stuffing attacks need a stricter, targeted limiter on `/api/auth/login` specifically (e.g., 10 attempts / 15 min per IP or per email).

### 1.8 Review endpoint is completely unauthenticated
`POST /books/:bookId/reviews` accepts any reviewer name string with no login required. Anyone can spam fake reviews. Require `protect` middleware and use `req.user.name` as the reviewer field instead of a user-supplied string.

### 1.9 `getUser` endpoint has no ownership check
`GET /api/auth/users/:id` (`Back-end/routes/Authroutes.js` line 16) — any authenticated user can fetch any other user's profile by supplying any valid ID. Add a check: `if (req.params.id !== req.user.id && req.user.role !== 'admin') return 403`.

---

## 2. DEAD / BROKEN CODE

### 2.1 `Authroutes.js` is never mounted — user endpoints are unreachable
`Back-end/routes/Authroutes.js` defines `GET /api/auth/users/:id` and `GET /api/auth/users` but this file is never imported in `routes.js` or `app.js`. These endpoints do not exist at runtime. Either mount it in `routes.js` (`router.use('/api/auth', authRoutes)`) or delete the file to avoid confusion.

### 2.2 `dashboard.js` is never mounted — stats endpoint is unreachable
`Back-end/routes/dashboard.js` defines `GET /api/dashboard/stats` (admin-only, well-written) but is never imported anywhere. The admin frontend that calls this endpoint gets 404. Mount it in `routes.js`.

### 2.3 `getBookBySlug` loads the entire books collection into memory
`Back-end/controllers/bookController.js` lines 63–70 — `Book.find({})` fetches every book, then uses `Array.prototype.find()` in JavaScript. This is O(n) memory and compute. Store a `slug` field on the Book model (or compute it at save time with a pre-save hook) and query with `Book.findOne({ slug })` directly.

### 2.4 Cart `bookId` type mismatch
`Back-end/routes/cart.js` lines 38–65 — Cart items store `bookId` as a plain string. Book documents use MongoDB `ObjectId`. The `cart.items.find(i => i.bookId === bookId)` comparison will always fail when the client sends an ObjectId string and the stored value is already a string, unless they were stored exactly the same way. Verify the Cart model's `bookId` field type and enforce consistency.

### 2.5 Duplicate auth route definitions
Login and signup are mounted directly in `app.js` (lines 44–45) AND defined again in `Authroutes.js`. Having two definitions for the same endpoint invites them to drift out of sync.

---

## 3. ARCHITECTURE & API DESIGN

### 3.1 Books identified by URL-encoded title — use `_id` instead
`PUT /books/title/:title` and `DELETE /books/title/:title` use a title string as the resource identifier. Titles with slashes, ampersands, or unicode need double-encoding and are fragile. Standard REST uses the resource's `_id`. Consider switching to `PUT /books/:id` and `DELETE /books/:id`.

### 3.2 No pagination anywhere
`GET /books` returns the full catalogue on every request. Add `?page` and `?limit` query parameters with sensible defaults (e.g., limit 20). Same for `GET /api/authors` and `GET /api/orders`. Without this, a catalogue of a few thousand books will noticeably slow the frontend and increase MongoDB load.

### 3.3 Race condition on stock decrement in order creation
`Back-end/routes/Order.js` lines 94–98 — checks `book.stock >= quantity` then decrements in two separate database operations. Two concurrent orders for the last copy can both pass the check and both decrement, resulting in stock going negative. Use a MongoDB atomic update with a `$inc` conditional: `findOneAndUpdate({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })` and treat a `null` result as out-of-stock.

### 3.4 No logout / token invalidation mechanism
There is no `POST /api/auth/logout` endpoint. The client can delete the cookie, but if a token is stolen, it's valid for its full 7-day lifetime. For production: implement a server-side token blocklist (Redis or a small DB collection of invalidated JTIs) or use short-lived access tokens + refresh tokens.

### 3.5 No token refresh flow
JWTs expire after 7 days with no refresh. Users are silently kicked out mid-session. A standard pattern is a short-lived access token (15 min) + long-lived refresh token (30 days), with a `POST /api/auth/refresh` endpoint.

### 3.6 Route file naming is inconsistent
`Authors.js`, `Authroutes.js`, `Order.js` use PascalCase; `books.js`, `cart.js`, `dashboard.js` use lowercase. Pick one convention (lowercase is Node standard) and rename throughout.

---

## 4. FRONTEND ISSUES

### 4.1 Hardcoded localhost URLs break in any deployed environment
- `views/pages/authentication(Ali)/auth.js` line 39: `window.location.href = 'http://127.0.0.1:5501/...'` — hardcoded Live Server URL
- `views/pages/authentication(Ali)/auth.js` line 49 & 56: `'http://localhost:3000'` fallback
- `views/pages/authentication(Ali)/dashboard.html` line 121: `const API_BASE = 'http://localhost:3000'`
- `views/pages/catalog(Marwan)/authors.html` line 259: `fetch('http://localhost:3000/books?author=...')`
- `views/pages/home(fares)/AllAuthors..html` line 227: same

Every page should derive the API base from `window.location.origin` when served by Express (which it is), or use a single shared `config.js` constant. The `127.0.0.1:5501` redirect will break the moment the site is on any other host.

### 4.2 JWT stored in `localStorage` — XSS-accessible
`authController.js` sends the token in both the response body (client stores in `localStorage`) and an `httpOnly` cookie. Storing JWTs in `localStorage` means any XSS vulnerability on any page can steal the token. Use the `httpOnly` cookie only; do not return the raw token in the JSON body.

### 4.3 Duplicate page file with typo in filename
`views/pages/home(fares)/AllAuthors.html` and `views/pages/home(fares)/AllAuthors..html` (double dot) both exist. One of them is likely the live version; the other should be deleted.

### 4.4 No loading states or error feedback on API calls
Pages render blank or flash until data arrives. Standard pattern: show a skeleton/spinner on mount, hide it on success, and show an inline error message on failure. Currently fetch errors are either silently swallowed or produce empty page sections.

### 4.5 Favorites have no backend
The favorites page (`account(Mikha)/favorites.html`) exists in the UI with no matching `favorites` field in the User model and no API endpoint. Users' favorites are lost on page refresh. Add a `favorites: [{ type: ObjectId, ref: 'Book' }]` field to the User model and `POST/DELETE /api/users/:id/favorites/:bookId` endpoints.

---

## 5. DATABASE & MODELS

### 5.1 No `maxlength` on Book text fields
`Book.js` — `title`, `description`, `author`, `genre`, `quote` have no `maxlength` constraint. A malicious request with a megabyte-long description would be stored in MongoDB and returned to every client. Add reasonable limits (e.g., `title: { maxlength: 300 }`, `description: { maxlength: 5000 }`).

### 5.2 `orderItemSchema` marks `bookId` as `required: true` but controller allows `null`
`Order.js` model line 8 requires `bookId`, but the order creation handler (`routes/Order.js` line 83) can set `bookId: null`. This will throw a Mongoose validation error on save for any order item without a valid book ID. Decide: either allow null and remove `required`, or always enforce a real book lookup.

### 5.3 No database index on `Book.title`
Every `GET /books/title/:title` and the slug-lookup workaround perform a full collection scan. Add `bookSchema.index({ title: 1 })` (or a text index) for acceptable query performance.

### 5.4 No TTL on Cart documents
Anonymous carts accumulate in MongoDB forever. Add a TTL index so carts auto-expire after inactivity:
```js
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days
```
Requires `timestamps: true` on the Cart schema.

### 5.5 `averageRating` / `reviewCount` can drift if reviews are deleted
The Book model denormalizes these values. `reviewController.js` recalculates on `addReview`, but there is no `deleteReview` endpoint. If one is added later without updating the book's aggregate, ratings will be wrong. Keep this in mind.

### 5.6 No `userId` link on Cart documents
Cart is session-based only. When a user logs in, their anonymous cart and their account are never merged. This is a known gap but worth calling out explicitly: a logged-in user who clears their browser loses their cart.

---

## 6. OPERATIONS & DEPLOYMENT

### 6.1 No HTTPS
The server speaks plain HTTP. Every password, token, and payment detail travels unencrypted. In production, terminate TLS at a reverse proxy (nginx, Caddy) or use a hosting platform that provides it. Set `cookie.secure = true` is already in the code but only activates when `NODE_ENV === 'production'`.

### 6.2 No graceful shutdown
`app.listen()` has no SIGTERM/SIGINT handler. A process kill during an in-flight database write can corrupt data. Add:
```js
process.on('SIGTERM', () => { server.close(() => mongoose.connection.close()); });
```

### 6.3 No health check endpoint
Load balancers and uptime monitors need a `GET /health` that returns 200 with DB status. Without it, a deployment platform has no way to know if the instance is healthy.

### 6.4 No structured logging
All server output is `console.log` / `console.error`. Production systems need structured JSON logs with timestamps, request IDs, log levels, and the ability to ship to a log aggregator (Datadog, Logtail, etc.). Add a lightweight logger like `pino` or `winston`.

### 6.5 `uploads/` directory is on local disk
Author profile images are stored at `Back-end/uploads/authors/`. On any deployment that doesn't persist the filesystem (Heroku dynos, Railway, Render free tier, Docker containers without volumes), every re-deploy wipes all uploaded images. Move file storage to an object store (AWS S3, Cloudinary, Backblaze B2).

### 6.6 No environment-specific configuration
`process.env.NODE_ENV` is only referenced for the cookie `secure` flag. Add guards for: disabling the admin fallback login in production, setting stricter CORS origins in production, and enabling CSP in production.

### 6.7 No CI/CD pipeline
No `.github/workflows/` or equivalent. No automated tests run on push. At minimum: a lint check and a smoke test (start the server, hit `/health`) should run on every PR.

---

## 7. MISSING FEATURES FOR PRODUCTION

| Feature | Status | Notes |
|---|---|---|
| Password reset (forgot password) | Missing | No email service, no reset token flow |
| Email notifications | Missing | Order confirmation, registration — no mailer configured |
| Pagination | Missing | All list endpoints return unlimited results |
| Full-text book search | Missing | Only exact genre/author filters exist |
| Review moderation / deletion | Missing | Admin cannot remove spam or abusive reviews |
| Image optimization | Missing | No WebP, no resizing, no CDN |
| API documentation | Missing | No OpenAPI/Swagger spec; hard to onboard new devs |
| Analytics / monitoring | Missing | No Sentry, no pageview tracking |
| Favorites persistence | Missing | UI exists, no DB or API backing |

---

## 8. QUICK WINS (low effort, high impact)

1. **Add `protect, adminOnly` to books write routes** (`books.js` lines 11–13) — one line each.
2. **Add auth to order routes** — at minimum protect `GET /` and `PUT/DELETE` endpoints.
3. **Remove the plaintext admin fallback** in `authController.js` lines 93–99.
4. **Import and use `stripHtml`** in `bookController.createBook`, `bookController.updateBook`, and `reviewController.addReview`.
5. **Mount `Authroutes.js` and `dashboard.js`** in `routes.js` — two lines.
6. **Replace hardcoded `localhost` URLs** with `window.location.origin` in all frontend JS files.
7. **Add a `GET /health` endpoint** to `app.js` — three lines.
8. **Add Cart TTL index** — one line in the Cart model.
9. **Fix `getBookBySlug`** to store slug on the model and query directly.
10. **Delete `AllAuthors..html`** (the double-dot duplicate file).
