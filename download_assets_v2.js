/**
 * download_assets_v2.js
 * Fixed version:
 *  - Uses OpenLibrary search API to find a covered edition for books with no direct ISBN cover
 *  - Uses Wikipedia REST API (/page/summary) to get author thumbnail URLs
 *    (avoids Wikimedia direct-download rate limits)
 *  - Adds delays between author requests
 *
 * Run: node download_assets_v2.js
 */

const https  = require('https');
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const { URL } = require('url');

const BASE_DIR    = path.join(__dirname);
const BOOKS_DIR   = path.join(BASE_DIR, 'views', 'resources', 'Books');
const AUTHORS_DIR = path.join(BASE_DIR, 'views', 'resources', 'Authors');

// ── helpers ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function download(url, dest, maxRedirects = 10) {
  return new Promise((resolve, reject) => {
    if (maxRedirects === 0) { reject(new Error('Too many redirects')); return; }

    let parsedUrl;
    try { parsedUrl = new URL(url); }
    catch (e) { reject(new Error(`Bad URL: ${url}`)); return; }

    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname : parsedUrl.hostname,
      path     : parsedUrl.pathname + parsedUrl.search,
      port     : parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      headers  : {
        'User-Agent': 'Mozilla/5.0 (compatible; Mactaba/1.0)',
        'Accept'    : 'image/jpeg,image/png,image/webp,image/*,*/*;q=0.8',
      },
    };

    const file = fs.createWriteStream(dest);
    let done = false;

    const cleanup = () => {
      if (!done) { done = true; file.close(); try { fs.unlinkSync(dest); } catch (_) {} }
    };

    const req = protocol.get(options, (res) => {
      const { statusCode, headers } = res;
      if ([301, 302, 303, 307, 308].includes(statusCode)) {
        res.resume(); cleanup();
        const loc  = headers.location;
        const next = loc && loc.startsWith('http') ? loc : `${parsedUrl.protocol}//${parsedUrl.hostname}${loc}`;
        download(next, dest, maxRedirects - 1).then(resolve).catch(reject);
        return;
      }
      if (statusCode !== 200) {
        res.resume(); cleanup();
        reject(new Error(`HTTP ${statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        done = true;
        file.close(() => {
          try {
            const sz = fs.statSync(dest).size;
            if (sz < 2048) { try { fs.unlinkSync(dest); } catch (_) {} reject(new Error(`Stub file (${sz}B)`)); }
            else resolve({ dest, size: sz });
          } catch (e) { reject(e); }
        });
      });
    });
    req.setTimeout(45000, () => { req.destroy(); cleanup(); reject(new Error('Timeout')); });
    req.on('error', (e) => { cleanup(); reject(e); });
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    let parsedUrl;
    try { parsedUrl = new URL(url); } catch (e) { reject(e); return; }
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsedUrl.hostname,
      path    : parsedUrl.pathname + parsedUrl.search,
      port    : parsedUrl.port || 443,
      headers : {
        'User-Agent': 'Mozilla/5.0 (compatible; Mactaba/1.0)',
        'Accept'    : 'application/json',
      },
    };
    let body = '';
    const req = protocol.get(options, (res) => {
      if (res.statusCode !== 200) { res.resume(); reject(new Error(`HTTP ${res.statusCode}`)); return; }
      res.on('data', d => body += d);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    });
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

// ── Find a covered edition via OpenLibrary search ──────────────────────────
async function findOpenLibraryCover(isbn, titleFallback) {
  // 1. Try the provided ISBN directly (already tried in v1 – skip if not needed here)
  //    But try a "search by isbn" to find the work and locate any edition with a cover
  try {
    const data = await fetchJson(
      `https://openlibrary.org/search.json?isbn=${isbn}&fields=cover_i,cover_edition_key,edition_key&limit=5`
    );
    if (data.docs) {
      for (const doc of data.docs) {
        if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
        if (doc.cover_edition_key) return `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-L.jpg`;
      }
    }
  } catch (_) {}

  // 2. Search by title
  if (titleFallback) {
    try {
      const q = encodeURIComponent(titleFallback);
      const data = await fetchJson(
        `https://openlibrary.org/search.json?q=${q}&fields=cover_i,cover_edition_key&limit=5`
      );
      if (data.docs) {
        for (const doc of data.docs) {
          if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
          if (doc.cover_edition_key) return `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-L.jpg`;
        }
      }
    } catch (_) {}
  }
  return null;
}

// ── Get author image via Wikipedia REST API ────────────────────────────────
async function getWikipediaThumb(title) {
  try {
    const data = await fetchJson(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    );
    if (data.thumbnail && data.thumbnail.source) return data.thumbnail.source;
    if (data.originalimage && data.originalimage.source) return data.originalimage.source;
  } catch (_) {}
  return null;
}

// ── Books ──────────────────────────────────────────────────────────────────

const BOOKS = [
  { isbn: '9781501115185', title: 'Ugly Love',                       filename: 'UglyLove.jpg',                    altIsbns: ['9781476753072','9781501156700'] },
  { isbn: '9781503215153', title: 'Journey to the Center of the Earth', filename: 'JourneyToTheCentreOfTheEarth.jpg', altIsbns: [] },
  { isbn: '9780553103540', title: 'A Game of Thrones',               filename: 'ASongOfIceAndFire.jpg',           altIsbns: ['9780553386790'] },
  { isbn: '9781538739723', title: 'Verity',                          filename: 'Verity.jpg',                      altIsbns: ['9781538739716'] },
  { isbn: '9780441175988', title: 'Chapterhouse Dune',               filename: 'Dune.jpg',                        altIsbns: ['9780441013593','9780399128981','9780441102679'] },
  { isbn: '9780307743657', title: 'The Shining',                     filename: 'TheShining.jpg',                  altIsbns: [] },
  { isbn: '9781627792127', title: 'Six of Crows',                    filename: 'SixOfCrows.jpg',                  altIsbns: [] },
  { isbn: '9781619634442', title: 'A Court of Thorns and Roses',     filename: 'CourtOfThornsAndRoses.jpg',       altIsbns: [] },
];

// ── Authors ────────────────────────────────────────────────────────────────

const AUTHORS = [
  { key: 'hemingway',              name: 'Ernest Hemingway',    filename: 'ErnestHemingway.jpg',     wikiTitle: 'Ernest Hemingway' },
  { key: 'nora-roberts',           name: 'Nora Roberts',        filename: 'NoraRoberts.jpg',         wikiTitle: 'Nora Roberts' },
  { key: 'tolstoy',                name: 'Leo Tolstoy',         filename: 'LeoTolstoy.jpg',          wikiTitle: 'Leo Tolstoy' },
  { key: 'jeyamohan',              name: 'B. Jeyamohan',        filename: 'Jeyamohan.jpg',           wikiTitle: 'Jeyamohan' },
  { key: 'pratchett',              name: 'Terry Pratchett',     filename: 'TerryPratchett.jpg',      wikiTitle: 'Terry Pratchett' },
  { key: 'astrid-lindgren',        name: 'Astrid Lindgren',     filename: 'AstridLindgren.jpg',      wikiTitle: 'Astrid Lindgren' },
  { key: 'indira-parthasarathy',   name: 'Indira Parthasarathy',filename: 'IndiraParthasarathy.jpg', wikiTitle: 'Indira Parthasarathy' },
  { key: 'naguib-mahfouz',         name: 'Naguib Mahfouz',      filename: 'NaguibMahfouz.jpg',       wikiTitle: 'Naguib Mahfouz' },
  { key: 'paulo-coelho',           name: 'Paulo Coelho',        filename: 'PauloCoelho.jpg',         wikiTitle: 'Paulo Coelho' },
  { key: 'fyodor-dostoevsky',      name: 'Fyodor Dostoevsky',   filename: 'FyodorDostoevsky.jpg',    wikiTitle: 'Fyodor Dostoevsky' },
];

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  const bookResults   = {};
  const authorResults = {};

  // ── 1. Book covers ──────────────────────────────────────────────────────
  console.log('\n═══ Book covers (Open Library) ═══');
  for (const book of BOOKS) {
    const dest = path.join(BOOKS_DIR, book.filename);

    // Skip if already downloaded successfully (from v1 run)
    if (fs.existsSync(dest) && fs.statSync(dest).size > 2048) {
      const sz = fs.statSync(dest).size;
      console.log(`  ✅ (cached)  ${book.title}  ${book.filename}  (${(sz/1024).toFixed(1)} KB)`);
      bookResults[book.isbn] = `resources/Books/${book.filename}`;
      continue;
    }

    process.stdout.write(`  ${book.title} … `);

    // Build list of candidate ISBN-based URLs
    const isbnUrls = [book.isbn, ...book.altIsbns].flatMap(i => [
      `https://covers.openlibrary.org/b/isbn/${i}-L.jpg`,
      `https://covers.openlibrary.org/b/isbn/${i}-M.jpg`,
    ]);

    let downloaded = false;
    for (const url of isbnUrls) {
      try {
        const r = await download(url, dest);
        console.log(`✅  ${book.filename}  (${(r.size/1024).toFixed(1)} KB)`);
        bookResults[book.isbn] = `resources/Books/${book.filename}`;
        downloaded = true;
        break;
      } catch (e) {
        process.stdout.write('');  // keep going silently
      }
    }

    if (!downloaded) {
      // Try OpenLibrary search API
      process.stdout.write(`(searching OL API) … `);
      const coverUrl = await findOpenLibraryCover(book.isbn, book.title);
      if (coverUrl) {
        try {
          const r = await download(coverUrl, dest);
          console.log(`✅  ${book.filename}  via OL search  (${(r.size/1024).toFixed(1)} KB)`);
          bookResults[book.isbn] = `resources/Books/${book.filename}`;
          downloaded = true;
        } catch (e) {
          console.log(`❌  OL search found URL but download failed: ${e.message}`);
        }
      } else {
        console.log(`❌  No cover found`);
      }
    }
  }

  // ── 2. Author photos (Wikipedia REST API) ───────────────────────────────
  console.log('\n═══ Author photos (Wikipedia REST API) ═══');
  for (const author of AUTHORS) {
    const dest = path.join(AUTHORS_DIR, author.filename);

    // Skip if already downloaded
    if (fs.existsSync(dest) && fs.statSync(dest).size > 2048) {
      const sz = fs.statSync(dest).size;
      console.log(`  ✅ (cached)  ${author.name}  ${author.filename}  (${(sz/1024).toFixed(1)} KB)`);
      authorResults[author.key] = `resources/Authors/${author.filename}`;
      continue;
    }

    process.stdout.write(`  ${author.name} … `);

    // Delay to respect rate limits
    await sleep(1500);

    const thumbUrl = await getWikipediaThumb(author.wikiTitle);
    if (!thumbUrl) {
      console.log(`❌  Wikipedia has no thumbnail for "${author.wikiTitle}"`);
      continue;
    }

    try {
      const r = await download(thumbUrl, dest);
      console.log(`✅  ${author.filename}  (${(r.size/1024).toFixed(1)} KB)`);
      authorResults[author.key] = `resources/Authors/${author.filename}`;
    } catch (e) {
      console.log(`❌  Download failed: ${e.message}  URL: ${thumbUrl}`);
    }
  }

  // ── 3. Update Books.Book.json ───────────────────────────────────────────
  console.log('\n═══ Updating Books.Book.json ═══');
  const booksJsonPath = path.join(BASE_DIR, 'Books.Book.json');
  const booksJson = JSON.parse(fs.readFileSync(booksJsonPath, 'utf8'));

  const isbnToPath = {
    '978-1501115185': bookResults['9781501115185'],
    '978-1503215153': bookResults['9781503215153'],
    '978-0553103540': bookResults['9780553103540'],
    '978-1538739723': bookResults['9781538739723'],
    '978-0441175988': bookResults['9780441175988'],
    '978-0307743657': bookResults['9780307743657'],
    '978-1627792127': bookResults['9781627792127'],
    '978-1619634442': bookResults['9781619634442'],
  };

  let updatedBooks = 0;
  for (const book of booksJson) {
    // Fix Verity's wrong ISBN
    const lookupIsbn = (book.title === 'Verity') ? '978-1538739723' : book.ISBN;
    const newPath = isbnToPath[lookupIsbn];
    if (newPath) {
      if (book.title === 'Verity' && book.ISBN === '978-1501115185') {
        book.ISBN = '978-1538739723';
        console.log(`  ⚑  Fixed Verity ISBN`);
      }
      console.log(`  ${book.title}: ${book.image} → ${newPath}`);
      book.image = newPath;
      updatedBooks++;
    }
  }
  fs.writeFileSync(booksJsonPath, JSON.stringify(booksJson, null, 2));
  console.log(`  ✅ Saved Books.Book.json (${updatedBooks}/${BOOKS.length} books updated)`);

  // ── 4. Update views/data.js ─────────────────────────────────────────────
  console.log('\n═══ Updating views/data.js ═══');
  const dataJsPath = path.join(BASE_DIR, 'views', 'data.js');
  let dataJs = fs.readFileSync(dataJsPath, 'utf8');

  const bookFileReplace = [
    { old: 'resources/Books/UglyLove.png',                        newVal: bookResults['9781501115185'] },
    { old: 'resources/Books/JourneyToThe CentreOfTheEarth.png',   newVal: bookResults['9781503215153'] },
    { old: 'resources/Books/ASongOfIceAndFire.png',               newVal: bookResults['9780553103540'] },
    { old: 'resources/Books/Verity.png',                          newVal: bookResults['9781538739723'] },
    { old: 'resources/Books/Dune.png',                            newVal: bookResults['9780441175988'] },
    { old: 'resources/Books/TheShining.png',                      newVal: bookResults['9780307743657'] },
    { old: 'resources/Books/six-of-crows.png',                    newVal: bookResults['9781627792127'] },
    { old: 'resources/Books/Court.png',                           newVal: bookResults['9781619634442'] },
    // Also handle the new names (already patched in v1 run, avoid double-replace)
    { old: 'resources/Books/JourneyToTheCentreOfTheEarth.jpg',    newVal: bookResults['9781503215153'] },
    { old: 'resources/Books/ASongOfIceAndFire.jpg',               newVal: bookResults['9780553103540'] },
    { old: 'resources/Books/Verity.jpg',                          newVal: bookResults['9781538739723'] },
    { old: 'resources/Books/TheShining.jpg',                      newVal: bookResults['9780307743657'] },
    { old: 'resources/Books/SixOfCrows.jpg',                      newVal: bookResults['9781627792127'] },
    { old: 'resources/Books/CourtOfThornsAndRoses.jpg',           newVal: bookResults['9781619634442'] },
  ];

  // Author path patterns (covers old hashed filenames AND any new ones from v1)
  const buildAuthorPath = (key) => authorResults[key] ? `../../${authorResults[key]}` : null;
  const authorFileReplace = [
    { old: '../../resources/Authors/316be4d7f6292c317b66ec05778384b8.jpg',              newVal: buildAuthorPath('hemingway') },
    { old: '../../resources/Authors/ernest-hemingway-800-450.png',                      newVal: buildAuthorPath('hemingway') },
    { old: '../../resources/Authors/ErnestHemingway.jpg',                               newVal: buildAuthorPath('hemingway') },
    { old: '../../resources/Authors/433bdb5b8cded5ed38f147685934a840.jpg',              newVal: buildAuthorPath('nora-roberts') },
    { old: '../../resources/Authors/nora-e1429382209389.jpg',                           newVal: buildAuthorPath('nora-roberts') },
    { old: '../../resources/Authors/NoraRoberts.jpg',                                   newVal: buildAuthorPath('nora-roberts') },
    { old: '../../resources/Authors/e74a07ca003304accf7e73675621697e.jpg',              newVal: buildAuthorPath('tolstoy') },
    { old: '../../resources/Authors/9228c6e3-8ac3-459f-b9a7-d0e72a2d9311_1200x992.jpg', newVal: buildAuthorPath('tolstoy') },
    { old: '../../resources/Authors/LeoTolstoy.jpg',                                    newVal: buildAuthorPath('tolstoy') },
    { old: '../../resources/Authors/Tamil_writer_Jeyamohan.jpg',                        newVal: buildAuthorPath('jeyamohan') },
    { old: '../../resources/Authors/Jeyamohan.jpg',                                     newVal: buildAuthorPath('jeyamohan') },
    { old: '../../resources/Authors/Terry-Pratchett-2011.webp',                         newVal: buildAuthorPath('pratchett') },
    { old: '../../resources/Authors/TerryPratchett.jpg',                                newVal: buildAuthorPath('pratchett') },
    { old: '../../resources/Authors/Astrid_Lindgren_(cropped).jpg',                     newVal: buildAuthorPath('astrid-lindgren') },
    { old: '../../resources/Authors/AstridLindgren.jpg',                                newVal: buildAuthorPath('astrid-lindgren') },
    { old: '../../resources/Authors/Dr. Indira Parthasarathy.gif',                      newVal: buildAuthorPath('indira-parthasarathy') },
    { old: '../../resources/Authors/d5210e1ed6bce26cefddc6f9b01a4384.jpg',              newVal: buildAuthorPath('indira-parthasarathy') },
    { old: '../../resources/Authors/IndiraParthasarathy.jpg',                           newVal: buildAuthorPath('indira-parthasarathy') },
  ];

  let dataJsChanges = 0;
  for (const { old, newVal } of [...bookFileReplace, ...authorFileReplace]) {
    if (newVal && dataJs.includes(old)) {
      dataJs = dataJs.split(old).join(newVal);
      console.log(`  ${old.split('/').pop()} → ${newVal.split('/').pop()}`);
      dataJsChanges++;
    }
  }
  fs.writeFileSync(dataJsPath, dataJs);
  console.log(`  ✅ Saved views/data.js (${dataJsChanges} substitutions)`);

  // ── 5. Mirror to views/data/data.js ────────────────────────────────────
  const dataJs2Path = path.join(BASE_DIR, 'views', 'data', 'data.js');
  if (fs.existsSync(dataJs2Path)) {
    fs.writeFileSync(dataJs2Path, dataJs);  // same content
    console.log(`  ✅ Saved views/data/data.js (mirror)`);
  }

  // ── 6. Final file listing ───────────────────────────────────────────────
  console.log('\n═══ Final file listing ═══');
  console.log('  Books:');
  for (const f of fs.readdirSync(BOOKS_DIR)) {
    const sz = fs.statSync(path.join(BOOKS_DIR, f)).size;
    console.log(`    ${f}  (${(sz/1024).toFixed(1)} KB)`);
  }
  console.log('  Authors:');
  for (const f of fs.readdirSync(AUTHORS_DIR)) {
    const sz = fs.statSync(path.join(AUTHORS_DIR, f)).size;
    console.log(`    ${f}  (${(sz/1024).toFixed(1)} KB)`);
  }

  // ── 7. Summary ──────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════');
  console.log('FINAL SUMMARY');
  console.log('──────────────────────────────────────────────────');
  const bOk = BOOKS.filter(b => bookResults[b.isbn]).length;
  const aOk = AUTHORS.filter(a => authorResults[a.key]).length;
  console.log(`Books:   ${bOk}/${BOOKS.length} covers`);
  console.log(`Authors: ${aOk}/${AUTHORS.length} photos`);
  console.log('');
  for (const b of BOOKS)   console.log(`  ${bookResults[b.isbn]   ? '✅' : '❌'}  ${b.title}`);
  for (const a of AUTHORS) console.log(`  ${authorResults[a.key] ? '✅' : '❌'}  ${a.name}`);
  console.log('══════════════════════════════════════════════════\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
