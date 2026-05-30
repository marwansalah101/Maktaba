/**
 * download_assets.js
 * Downloads book covers from Open Library and author photos from Wikimedia Commons.
 * Then updates Books.Book.json and views/data.js with the correct local paths.
 *
 * Run: node download_assets.js
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const { URL } = require('url');

const BASE_DIR    = path.join(__dirname);
const BOOKS_DIR   = path.join(BASE_DIR, 'views', 'resources', 'Books');
const AUTHORS_DIR = path.join(BASE_DIR, 'views', 'resources', 'Authors');

// ── helpers ────────────────────────────────────────────────────────────────

function download(url, dest, maxRedirects = 8) {
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
        'User-Agent': 'Mozilla/5.0 (Mactaba-Downloader/1.0)',
        'Accept'    : 'image/jpeg,image/png,image/webp,image/*,*/*;q=0.8',
      },
    };

    const file = fs.createWriteStream(dest);
    let finished = false;

    const cleanup = () => {
      if (!finished) {
        finished = true;
        file.close();
        try { fs.unlinkSync(dest); } catch (_) {}
      }
    };

    const req = protocol.get(options, (res) => {
      const { statusCode, headers } = res;

      if ([301, 302, 303, 307, 308].includes(statusCode)) {
        res.resume();
        cleanup();
        const loc = headers.location;
        const next = loc.startsWith('http') ? loc : `${parsedUrl.protocol}//${parsedUrl.hostname}${loc}`;
        download(next, dest, maxRedirects - 1).then(resolve).catch(reject);
        return;
      }

      if (statusCode !== 200) {
        res.resume();
        cleanup();
        reject(new Error(`HTTP ${statusCode} for ${url}`));
        return;
      }

      res.pipe(file);
      file.on('finish', () => {
        finished = true;
        file.close(() => {
          try {
            const sz = fs.statSync(dest).size;
            if (sz < 2048) {
              try { fs.unlinkSync(dest); } catch (_) {}
              reject(new Error(`Suspiciously small file (${sz} B) – likely an error stub`));
            } else {
              resolve({ dest, size: sz });
            }
          } catch (e) { reject(e); }
        });
      });
    });

    req.setTimeout(30000, () => { req.destroy(); cleanup(); reject(new Error(`Timeout: ${url}`)); });
    req.on('error', (e) => { cleanup(); reject(e); });
  });
}

async function tryUrls(urls, dest) {
  for (const url of urls) {
    try {
      const result = await download(url, dest);
      return { ok: true, url, ...result };
    } catch (e) {
      console.warn(`  ↳ tried ${url}: ${e.message}`);
    }
  }
  return { ok: false };
}

// ── book covers (Open Library) ─────────────────────────────────────────────
// Open Library cover API: https://covers.openlibrary.org/b/isbn/{ISBN}-{S}.jpg
// L = large (~500px wide), M = medium (~200px), S = small (~85px)
// Strip hyphens from ISBNs for the API.

const BOOKS = [
  { isbn: '9781501115185', filename: 'UglyLove.jpg',                   title: 'Ugly Love' },
  { isbn: '9781503215153', filename: 'JourneyToTheCentreOfTheEarth.jpg', title: 'Journey to the Center of the Earth' },
  { isbn: '9780553103540', filename: 'ASongOfIceAndFire.jpg',           title: 'A Song of Ice and Fire' },
  { isbn: '9781538739723', filename: 'Verity.jpg',                      title: 'Verity' },
  { isbn: '9780441175988', filename: 'Dune.jpg',                        title: 'Chapterhouse: Dune' },
  { isbn: '9780307743657', filename: 'TheShining.jpg',                  title: 'The Shining' },
  { isbn: '9781627792127', filename: 'SixOfCrows.jpg',                  title: 'Six of Crows' },
  { isbn: '9781619634442', filename: 'CourtOfThornsAndRoses.jpg',       title: 'A Court of Thorns and Roses' },
];

// ── author photos (Wikimedia Commons) ─────────────────────────────────────

const AUTHORS = [
  {
    key: 'hemingway', name: 'Ernest Hemingway',
    filename: 'ErnestHemingway.jpg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/ErnestHemingway.jpg/400px-ErnestHemingway.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/2/28/ErnestHemingway.jpg',
    ],
  },
  {
    key: 'nora-roberts', name: 'Nora Roberts',
    filename: 'NoraRoberts.jpg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Nora_Roberts.jpg/400px-Nora_Roberts.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/7/7b/Nora_Roberts.jpg',
    ],
  },
  {
    key: 'tolstoy', name: 'Leo Tolstoy',
    filename: 'LeoTolstoy.jpg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/L.N.Tolstoy_Prokudin-Gorsky.jpg/400px-L.N.Tolstoy_Prokudin-Gorsky.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/c/c6/L.N.Tolstoy_Prokudin-Gorsky.jpg',
    ],
  },
  {
    key: 'jeyamohan', name: 'B. Jeyamohan',
    filename: 'Jeyamohan.jpg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Tamil_writer_Jeyamohan.jpg/400px-Tamil_writer_Jeyamohan.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/5/55/Tamil_writer_Jeyamohan.jpg',
    ],
  },
  {
    key: 'pratchett', name: 'Terry Pratchett',
    filename: 'TerryPratchett.jpg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/TERRY_PRATCHETT_AT_NAPIER.jpg/400px-TERRY_PRATCHETT_AT_NAPIER.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/7/77/TERRY_PRATCHETT_AT_NAPIER.jpg',
    ],
  },
  {
    key: 'astrid-lindgren', name: 'Astrid Lindgren',
    filename: 'AstridLindgren.jpg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Astrid_Lindgren_%28cropped%29.jpg/400px-Astrid_Lindgren_%28cropped%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/2/21/Astrid_Lindgren_%28cropped%29.jpg',
    ],
  },
  {
    key: 'indira-parthasarathy', name: 'Indira Parthasarathy',
    filename: 'IndiraParthasarathy.jpg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Dr._Indira_Parthasarathy.jpg/400px-Dr._Indira_Parthasarathy.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/04/Dr._Indira_Parthasarathy.jpg',
    ],
  },
  // sampleAuthor.js authors
  {
    key: 'naguib-mahfouz', name: 'Naguib Mahfouz',
    filename: 'NaguibMahfouz.jpg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Naguib_Mahfouz.jpg/400px-Naguib_Mahfouz.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/06/Naguib_Mahfouz.jpg',
    ],
  },
  {
    key: 'paulo-coelho', name: 'Paulo Coelho',
    filename: 'PauloCoelho.jpg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Paulo_Coelho_2010.jpg/400px-Paulo_Coelho_2010.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/7/71/Paulo_Coelho_2010.jpg',
    ],
  },
  {
    key: 'fyodor-dostoevsky', name: 'Fyodor Dostoevsky',
    filename: 'FyodorDostoevsky.jpg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Vasily_Perov_-_Portrait_of_Fyodor_Dostoyevsky.jpg/400px-Vasily_Perov_-_Portrait_of_Fyodor_Dostoyevsky.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/7/78/Vasily_Perov_-_Portrait_of_Fyodor_Dostoyevsky.jpg',
    ],
  },
];

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  const bookResults   = {};
  const authorResults = {};

  // ── 1. Book covers ──────────────────────────────────────────────────────
  console.log('\n═══ Downloading book covers (Open Library) ═══');
  for (const book of BOOKS) {
    const dest  = path.join(BOOKS_DIR, book.filename);
    const isbn  = book.isbn.replace(/-/g, '');
    const urls  = [
      `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
      `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
    ];

    process.stdout.write(`  ${book.title} … `);
    const result = await tryUrls(urls, dest);
    if (result.ok) {
      console.log(`✅  ${book.filename}  (${(result.size / 1024).toFixed(1)} KB)`);
      bookResults[book.isbn] = `resources/Books/${book.filename}`;
    } else {
      console.log(`❌  FAILED – no usable cover found`);
      bookResults[book.isbn] = null;
    }
  }

  // ── 2. Author photos ────────────────────────────────────────────────────
  console.log('\n═══ Downloading author photos (Wikimedia Commons) ═══');
  for (const author of AUTHORS) {
    const dest = path.join(AUTHORS_DIR, author.filename);
    process.stdout.write(`  ${author.name} … `);
    const result = await tryUrls(author.urls, dest);
    if (result.ok) {
      console.log(`✅  ${author.filename}  (${(result.size / 1024).toFixed(1)} KB)`);
      authorResults[author.key] = `resources/Authors/${author.filename}`;
    } else {
      console.log(`❌  FAILED`);
      authorResults[author.key] = null;
    }
  }

  // ── 3. Update Books.Book.json ───────────────────────────────────────────
  console.log('\n═══ Updating Books.Book.json ═══');
  const booksJsonPath = path.join(BASE_DIR, 'Books.Book.json');
  const booksJson = JSON.parse(fs.readFileSync(booksJsonPath, 'utf8'));

  // Map ISBN → filename.  Verity has wrong ISBN in Books.Book.json (same as Ugly Love);
  // the correct ISBN from views/data.js is 978-1538739723.
  const isbnMap = {
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
    const newPath = isbnMap[book.ISBN];
    if (newPath) {
      const old = book.image;
      book.image = newPath;
      // Fix Verity's wrong ISBN while we're here
      if (book.title === 'Verity' && book.ISBN === '978-1501115185') {
        book.ISBN = '978-1538739723';
        console.log(`  ⚑  Fixed Verity ISBN 978-1501115185 → 978-1538739723`);
      }
      console.log(`  ${book.title}: ${old} → ${book.image}`);
      updatedBooks++;
    }
  }
  fs.writeFileSync(booksJsonPath, JSON.stringify(booksJson, null, 2));
  console.log(`  Saved Books.Book.json (${updatedBooks} books updated)`);

  // ── 4. Update views/data.js ─────────────────────────────────────────────
  console.log('\n═══ Updating views/data.js ═══');
  const dataJsPath = path.join(BASE_DIR, 'views', 'data.js');
  let dataJs = fs.readFileSync(dataJsPath, 'utf8');

  // Update book image paths in the Books array
  const bookFilenameMap = {};
  for (const b of BOOKS) {
    if (bookResults[b.isbn]) bookFilenameMap[b.isbn] = bookResults[b.isbn];
  }

  // Replace image entries by matching ISBN lines nearby – simpler: direct filename replacement
  const bookFileReplace = [
    { old: 'resources/Books/UglyLove.png',                        newVal: bookResults['9781501115185'] },
    { old: 'resources/Books/JourneyToThe CentreOfTheEarth.png',   newVal: bookResults['9781503215153'] },
    { old: 'resources/Books/ASongOfIceAndFire.png',               newVal: bookResults['9780553103540'] },
    { old: 'resources/Books/Verity.png',                          newVal: bookResults['9781538739723'] },
    { old: 'resources/Books/Dune.png',                            newVal: bookResults['9780441175988'] },
    { old: 'resources/Books/TheShining.png',                      newVal: bookResults['9780307743657'] },
    { old: 'resources/Books/six-of-crows.png',                    newVal: bookResults['9781627792127'] },
    { old: 'resources/Books/Court.png',                           newVal: bookResults['9781619634442'] },
  ];

  for (const { old, newVal } of bookFileReplace) {
    if (newVal && dataJs.includes(old)) {
      dataJs = dataJs.split(old).join(newVal);
      console.log(`  book image: ${old} → ${newVal}`);
    }
  }

  // Update author profileImg / bannerImg
  const authorFileReplace = [
    // hemingway
    { old: '../../resources/Authors/316be4d7f6292c317b66ec05778384b8.jpg',            newVal: authorResults['hemingway'] ? `../../${authorResults['hemingway']}` : null },
    // nora-roberts
    { old: '../../resources/Authors/433bdb5b8cded5ed38f147685934a840.jpg',            newVal: authorResults['nora-roberts'] ? `../../${authorResults['nora-roberts']}` : null },
    { old: '../../resources/Authors/nora-e1429382209389.jpg',                         newVal: authorResults['nora-roberts'] ? `../../${authorResults['nora-roberts']}` : null },
    // tolstoy
    { old: '../../resources/Authors/e74a07ca003304accf7e73675621697e.jpg',            newVal: authorResults['tolstoy'] ? `../../${authorResults['tolstoy']}` : null },
    // jeyamohan
    { old: '../../resources/Authors/Tamil_writer_Jeyamohan.jpg',                      newVal: authorResults['jeyamohan'] ? `../../${authorResults['jeyamohan']}` : null },
    // pratchett
    { old: '../../resources/Authors/Terry-Pratchett-2011.webp',                       newVal: authorResults['pratchett'] ? `../../${authorResults['pratchett']}` : null },
    // astrid-lindgren
    { old: '../../resources/Authors/Astrid_Lindgren_(cropped).jpg',                   newVal: authorResults['astrid-lindgren'] ? `../../${authorResults['astrid-lindgren']}` : null },
    // indira-parthasarathy
    { old: '../../resources/Authors/Dr. Indira Parthasarathy.gif',                    newVal: authorResults['indira-parthasarathy'] ? `../../${authorResults['indira-parthasarathy']}` : null },
    { old: '../../resources/Authors/d5210e1ed6bce26cefddc6f9b01a4384.jpg',            newVal: authorResults['indira-parthasarathy'] ? `../../${authorResults['indira-parthasarathy']}` : null },
    { old: '../../resources/Authors/9228c6e3-8ac3-459f-b9a7-d0e72a2d9311_1200x992.jpg', newVal: authorResults['tolstoy'] ? `../../${authorResults['tolstoy']}` : null },
    { old: '../../resources/Authors/ernest-hemingway-800-450.png',                    newVal: authorResults['hemingway'] ? `../../${authorResults['hemingway']}` : null },
  ];

  for (const { old, newVal } of authorFileReplace) {
    if (newVal && dataJs.includes(old)) {
      dataJs = dataJs.split(old).join(newVal);
      console.log(`  author img: …${old.slice(-40)} → …${newVal.slice(-40)}`);
    }
  }

  fs.writeFileSync(dataJsPath, dataJs);
  console.log(`  Saved views/data.js`);

  // ── 5. Update views/data/data.js (mirror) ──────────────────────────────
  const dataJs2Path = path.join(BASE_DIR, 'views', 'data', 'data.js');
  if (fs.existsSync(dataJs2Path)) {
    let dataJs2 = fs.readFileSync(dataJs2Path, 'utf8');
    for (const { old, newVal } of [...bookFileReplace, ...authorFileReplace]) {
      if (newVal && dataJs2.includes(old)) {
        dataJs2 = dataJs2.split(old).join(newVal);
      }
    }
    fs.writeFileSync(dataJs2Path, dataJs2);
    console.log(`  Saved views/data/data.js`);
  }

  // ── 6. Summary ──────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('──────────────────────────────────────────────────');

  const bookOk   = BOOKS.filter(b => bookResults[b.isbn]).length;
  const authorOk = AUTHORS.filter(a => authorResults[a.key]).length;
  console.log(`Books:   ${bookOk}/${BOOKS.length} covers downloaded`);
  console.log(`Authors: ${authorOk}/${AUTHORS.length} photos downloaded`);

  for (const b of BOOKS) {
    const ok = !!bookResults[b.isbn];
    console.log(`  ${ok ? '✅' : '❌'}  ${b.title}`);
  }
  for (const a of AUTHORS) {
    const ok = !!authorResults[a.key];
    console.log(`  ${ok ? '✅' : '❌'}  ${a.name}`);
  }
  console.log('══════════════════════════════════════════════════\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
