# Maktaba — Project Code Review

**Date:** 2026-05-31
**Reviewer:** Claude Code (automated audit)
**Branch:** `main`
**Stack:** Node.js · Express 5 · Mongoose · MongoDB Atlas · Vanilla JS / HTML/CSS

---

## Grading Rubric Results

| Criterion | Weight | Status | Assessment |
|---|---|---|---|
| MVC & Routing | 15 | ✅ Full | Excellent separation |
| Authentication (Security & Privacy) | 5 | ✅ Full | JWT + bcrypt + protected routes + logout *(fixed)* |
| Sessions | 5 | ✅ Full | JWT auth + UUID cart sessions |
| Uploading Files | 5 | ✅ Full | multer configured with limits |
| Error Handling | 5 | ✅ Full | Global handler, try-catch everywhere |
| Data Validation (Frontend + Backend) | 10 | ✅ Full | Backend strong + sanitization *(fixed)* |
| CRUD Operations | 15 | ✅ Full | All major entities covered |
| AJAX/Fetch | 5 | ✅ Full | Extensive fetch usage throughout |
| Application UI/UX Quality | 5 | ✅ Full | Professional, animated, consistent |
| Innovation | 10 | ✅ Full | AI recommendations + fly-to-cart animation |
| **Bonus — HTTPS Support** | 5 | ❌ Missing | No native HTTPS config |
| **Bonus — Localization** | 5 | ❌ Missing | English-only, no i18n library |
| **Bonus — External API** | 5 | ✅ Full | OpenRouter, OpenLibrary, Google Sign-In |
| **Bonus — Responsive UI** | — | ✅ Full | 53 media queries, mobile-first |
| **Bonus — Pagination** | — | ❌ Missing | No skip/limit on any endpoint |
| **Bonus — Deployment & Domain** | — | ❌ Missing | No Dockerfile, Procfile, or cloud config |

---

## 1. MVC & Routing ✅ — Excellent

The project follows a clean MVC pattern with proper separation of concerns.

**What's in place:**
- `Back-end/models/` — 6 Mongoose schemas (User, Book, Author, Order, Cart, Review)
- `Back-end/controllers/` — 4 controller files (auth, book, author, review), each holding only business logic
- `Back-end/routes/` — 7 route files, each mapped to a resource (`books.js`, `Authors.js`, `cart.js`, `Order.js`, `Authroutes.js`, `dashboard.js`)
- `routes.js` acts as the central router and mounts each sub-router cleanly
- `views/` is organized into pages by feature, with assets co-located

**Minor issues:**
- Route file casing is inconsistent (`Authors.js`, `Order.js` vs `books.js`, `cart.js`) — convention should be lowercase for all files
- `dashboard.js` mixes query logic that belongs in a controller
- No barrel exports — routes import controllers directly, which is fine but could be organized better as the project grows

---

## 2. Authentication (Security & Privacy) ✅ — Fixed

**What's in place:**
- Passwords hashed with **bcryptjs** (salt rounds = 12) via Mongoose pre-save hook (`Back-end/models/user.js`)
- **JWT tokens** signed with `process.env.JWT_SECRET`, expire in 7 days (`JWT_EXPIRES_IN`)
- Cookies set with `httpOnly: true`, `sameSite: 'strict'`, `secure` flag tied to `NODE_ENV === 'production'`
- `protect` middleware in `Back-end/middlewares/auth.js` verifies JWT from Bearer header or cookie
- `adminOnly` middleware checks `user.role === 'admin'`
- Email normalized (lowercased, trimmed) before any DB query

**Fixes applied:**

1. **All write endpoints are now protected.**
   - `POST /books`, `PUT /books/:title`, `DELETE /books/:title` → `protect + adminOnly`
   - `POST /api/authors`, `PUT /api/authors/:id`, `DELETE /api/authors/:id` → `protect + adminOnly`
   - `GET /orders` (all orders), `PUT /orders/:num/status`, `PUT /orders/:num/payment` → `protect + adminOnly`
   - `POST /:bookId/reviews` → `protect` (any logged-in user)
   - `GET /api/auth/users` (user list) → `protect + adminOnly`

2. **Plaintext admin fallback removed.** The `.env`-based admin login that compared passwords in plain text has been deleted. Admin accounts must be created via the normal signup flow and have their `role` field set to `'admin'` in the database.

3. **Logout endpoint added.** `POST /api/auth/logout` clears the `token` cookie server-side. Frontend should also clear `localStorage` on logout.

4. **Profile and update routes secured.** `GET /api/auth/profile` and `PUT /api/auth/update` now require `protect` and use `req.user` from the verified JWT — the old insecure `x-user-email` header has been removed.

**Remaining known limitation:**
- Content Security Policy is still disabled (`app.js` line 15) because inline `<script>` tags are used throughout the frontend. This requires a frontend refactor to enable.

---

## 3. Sessions ✅ — Good

Two session mechanisms are used correctly:

- **JWT-based auth sessions** — token stored in cookie + localStorage, sent as `Authorization: Bearer` header on API calls
- **UUID cart sessions** (`Back-end/routes/cart.js` lines 7-12) — anonymous UUID generated client-side, sent via `x-session-id` header, stored in the `Cart` MongoDB collection

**Limitation:** Cart sessions are not linked to authenticated users. A logged-in user's cart is separate from their anonymous pre-login cart — there is no cart merge on login. This is a common UX gap but not a security issue.

---

## 4. File Uploading ✅ — Good

multer is configured correctly in `Back-end/routes/Authors.js`:
- Disk storage to `./uploads/authors/`
- Image-only filter (`file.mimetype.startsWith('image/')`)
- 5 MB size limit
- Timestamped filenames to prevent collisions
- `fs.mkdirSync` ensures the upload directory exists

Uploaded files served from `/uploads` static route (`app.js` line 28).

**Remaining gaps:**
- Book cover images cannot be uploaded — books only store an image URL string. The `POST /books` endpoint has no multer middleware.
- MIME type check relies on the `mimetype` string reported by the client rather than actual file magic bytes.

---

## 5. Error Handling ✅ — Good

- **Global error handler** in `app.js` (lines 76–79) with the required 4-parameter Express signature
- **404 handler** at the bottom of the middleware chain
- Every controller function wraps logic in `try/catch` and calls `next(err)` on failure
- `CastError` (invalid MongoDB ObjectId) is caught and returns a readable 400 response
- Express 5 automatically catches rejected promises from async route handlers, so no async wrapper is needed

**Minor gap:** Console logging only (`console.error`) — no structured log with timestamps or request IDs. Acceptable for a student project.

---

## 6. Data Validation (Frontend + Backend) ✅ — Fixed

**Backend validation:**
- Signup enforces: name ≥ 2 chars, valid email format (regex), password ≥ 8 chars, duplicate email check
- Login validates email format before hitting the database
- `bookController.js` checks all 9 required fields, plus: `price > 0`, `year` within valid range, `pages > 0`, `stock ≥ 0`
- `reviewController.js` validates `bookId` as ObjectId, rating 1–5 integer, reviewer name required
- Mongoose schemas enforce `required`, `unique`, `min`/`max`, `maxlength` at the DB level

**Sanitization (new — `Back-end/utils/sanitize.js`):**
- All free-text string fields strip HTML tags via `stripHtml()` before being saved to the database
- Applied to: book title, author, genre, description, quote, language, ISBN
- Applied to: review `reviewer` name and `comment`
- Applied to: author `name`, `aboutTitle`, `aboutText`
- This prevents stored XSS attacks where a malicious user could inject `<script>` tags through the API

**Frontend validation:**
- Signup/login form validates email format (regex), password length ≥ 8, full name length ≥ 2
- Real-time field feedback with error messages
- Form submission blocked if any field is invalid

**Remaining gaps:**
- Checkout form only checks field presence, not format (no postal code, phone format validation)
- Favorites and order history stored in `localStorage` — data lost if browser is cleared

---

## 7. CRUD Operations ✅ — Excellent

All major resources have full create/read/update/delete coverage:

| Resource | Create | Read | Update | Delete |
|---|---|---|---|---|
| Users | ✅ `/api/auth/signup` | ✅ `GET /api/auth/users/:id` | ✅ `PUT /api/auth/update` | ❌ |
| Books | ✅ `POST /books` | ✅ `GET /books` + slug/title/genre/author | ✅ `PUT /books/title/:title` | ✅ `DELETE /books/title/:title` |
| Authors | ✅ `POST /api/authors` | ✅ `GET /api/authors` + slug/id/books | ✅ `PUT /api/authors/:id` | ✅ `DELETE /api/authors/:id` |
| Orders | ✅ `POST /orders` | ✅ `GET /orders` + by email/number | ✅ status + payment update | ✅ soft-delete (cancel) |
| Cart | ✅ `POST /api/cart/add` | ✅ `GET /api/cart` | ✅ `PUT /api/cart/update/:bookId` | ✅ remove + clear |
| Reviews | ✅ `POST /books/:id/reviews` | ✅ `GET /books/:id/reviews` | ❌ | ❌ |

**Notable quality:** Order creation decrements book stock atomically, and cancellation restores it — correct business logic.

**Remaining gaps:** No user delete, no review edit or delete.

---

## 8. AJAX / Fetch ✅ — Good

The frontend communicates with the backend exclusively via `fetch()` — no full-page form submissions or page reloads on data operations.

- Auth flow: signup, login, profile update all use `fetch` with JSON body and Bearer token headers
- Product page: fetches book data by slug, renders dynamically
- Cart: uses session ID header `x-session-id` on every cart request
- AI recommendation: receives server-sent events (SSE) stream and renders text progressively

**Gaps:**
- No centralized API client — every file manually constructs headers, base URLs, and error handling
- Hardcoded `http://127.0.0.1:5501` in `auth.js` redirect — will break on any other host/port

---

## 9. Application UI/UX Quality ✅ — Good

**Design quality:**
- Consistent color palette (warm browns, cream, off-white — appropriate for a bookstore)
- Typography: Playfair Display for headings, Space Grotesk / Lora for body — a good pairing
- Smooth animations: fly-to-cart trajectory animation, cart badge bounce, hero section fade-in
- Material Symbols icons used consistently throughout
- Dark mode toggle implemented on auth page

**Pages covered:**
- Home, Catalog/Collection, Product detail, Checkout, Signup/Login, Account (settings, favorites, contact), Admin dashboard, Order history, Authors, Legal (terms/privacy), About, 404

**Issues:**
- Hardcoded `localhost` URLs in frontend JS will fail on any other host
- Some pages manage state (favorites, cart totals) exclusively in `localStorage`
- No loading/skeleton states for async content — page flashes empty before data loads
- Accessibility: some images lack `alt` attributes; no ARIA roles on custom interactive elements

---

## 10. Innovation ✅ — Excellent

Two standout features that go well beyond the assignment baseline:

**AI Book Recommendations** (`Back-end/controllers/authController.js` `recommend` handler):
- The server proxies requests to **OpenRouter** (GPT model) and streams the response back to the client as SSE
- The entire book catalogue is injected into the system prompt so the AI only recommends books the store actually carries
- The API key never leaves the server — it is loaded from `.env` and kept private
- The client renders streamed tokens progressively for a ChatGPT-style feel

**Fly-to-Cart Animation:**
- When a user adds a book to cart, the cover image animates along a bezier curve trajectory from its position to the cart icon
- Coordinates calculated dynamically via `getBoundingClientRect()`

Both features demonstrate initiative and show knowledge beyond what was taught.

---

## Bonus Criteria

### External API ✅
Three external APIs integrated:
1. **OpenRouter** — AI recommendations (server-side, API key never exposed to client)
2. **OpenLibrary Covers** — Book cover images in the seeder
3. **Google Sign-In** — OAuth2 token decoded client-side

### Responsive UI ✅
- `<meta name="viewport">` present on all 16 HTML pages
- 53 media query breakpoints across CSS files
- Mobile-first layout: hamburger menu, stacked cards, responsive checkout grid

### HTTPS ❌
No HTTPS configuration in the Express server. The `secure` cookie flag is inactive in development. Requires a reverse proxy (nginx, Caddy) or deployment platform (Render, Railway) to terminate TLS.

### Localization ❌
All UI text is hardcoded in English. No i18n library or translation files.

### Pagination ❌
No `skip`/`limit` query parameters on any route. `GET /books` returns the entire catalogue. A simple `?page=1&limit=20` pattern on `getAllBooks` and `getAllAuthors` would address this.

### Deployment ❌
No `Dockerfile`, `docker-compose.yml`, `Procfile`, or `render.yaml`. A one-line `Procfile` (`web: npm --prefix Back-end start`) is enough to deploy to Railway or Render and earn this mark.

---

## Security Summary

| Severity | Issue | Status |
|---|---|---|
| 🔴 Critical | Write endpoints had no authentication | ✅ Fixed — `protect + adminOnly` applied |
| 🔴 Critical | Admin fallback used plaintext password comparison | ✅ Fixed — fallback removed entirely |
| 🟠 High | No HTML sanitization — stored XSS possible | ✅ Fixed — `stripHtml()` applied to all user input |
| 🟠 High | No logout / token revocation | ✅ Fixed — `POST /api/auth/logout` clears cookie |
| 🟠 High | Profile/update used spoofable `x-user-email` header | ✅ Fixed — uses verified `req.user` from JWT |
| 🟠 High | Content Security Policy fully disabled | ⚠️ Remains — requires frontend refactor to fix |
| 🟡 Medium | Cart not linked to user on login | ⚠️ Remains |
| 🟡 Medium | No rate limiting on auth endpoints specifically | ⚠️ Remains |

---

## What Remains Before Submission

**For bonus marks:**
1. Add pagination (`?page` + `?limit`) to `GET /books` and `GET /api/authors`
2. Add a `Procfile` for deployment bonus (`web: npm --prefix Back-end start`)

**Polish (quality points):**
3. Replace hardcoded `localhost` / `127.0.0.1` URLs in frontend JS with relative paths
4. Add loading states for async data fetches to avoid blank page flicker
5. Move favorites/wishlist from `localStorage` to the database
