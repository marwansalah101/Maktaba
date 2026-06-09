/* ══════════════════════════════════════════════════════════════════
   DASHBOARD — Navigation, Modals, Books & Authors CRUD, Charts
══════════════════════════════════════════════════════════════════ */

const ADMIN_API_BASE = window.location.port === '3000' ? '' : 'http://localhost:3000';

// ─── Dashboard Navigation ────────────────────────────────────────
function goToAuthors() { window.location.href = '/totalauth'; }
function goToBooks()   { window.location.href = '/authbooks'; }
function toggleMenu()  { document.getElementById('sidebar').classList.toggle('active'); }

/* ══════════════════════════════════════════════════════════════════
   BOOK MODAL
══════════════════════════════════════════════════════════════════ */
function openAddBookModal() {
    const modal = document.getElementById('addBookModal');
    if (modal) { modal.classList.add('show'); const form = document.getElementById('addBookForm'); if (form) form.reset(); }
}
function closeAddBookModal() {
    const modal = document.getElementById('addBookModal');
    if (!modal) return;
    modal.classList.remove('show');
    delete modal.dataset.editId;
    const h2 = modal.querySelector('.modal-header h2');
    if (h2) h2.textContent = 'Add New Book';
    const form = document.getElementById('addBookForm');
    if (form) form.reset();
}

/* ══════════════════════════════════════════════════════════════════
   AUTHOR MODAL
══════════════════════════════════════════════════════════════════ */
function openAddAuthorModal() {
    const modal = document.getElementById('addAuthorModal');
    if (!modal) return;
    delete modal.dataset.editId;
    const h2 = modal.querySelector('.modal-header h2');
    if (h2) h2.textContent = 'Add New Author';
    const profileField = document.getElementById('authorProfileImgFile');
    if (profileField) profileField.setAttribute('required', '');
    const form = document.getElementById('addAuthorForm');
    if (form) form.reset();
    modal.classList.add('show');
}
function closeAddAuthorModal() {
    const modal = document.getElementById('addAuthorModal');
    if (!modal) return;
    modal.classList.remove('show');
    delete modal.dataset.editId;
    const h2 = modal.querySelector('.modal-header h2');
    if (h2) h2.textContent = 'Add New Author';
    const profileField = document.getElementById('authorProfileImgFile');
    if (profileField) profileField.setAttribute('required', '');
}

function normalizeAuthorBooks(value) {
    return value
        .split(',')
        .map(item => item.trim())
        .filter(item => /^[0-9a-fA-F]{24}$/.test(item));
}

function appendAuthorCard(author) {
    const cards = document.querySelector('.cards');
    if (!cards || !author) return;

    const booksCount = Array.isArray(author.books) ? author.books.length : 0;
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="avatar">${author.name.charAt(0).toUpperCase()}</div>
      <div class="info">
        <h3>${author.name}</h3>
        <p class="sub">${author.slug.replace(/-/g, ' ')}</p>
        <p class="desc">${author.aboutText || ''}</p>
        <div class="bottom">
          <span class="books">${booksCount} book${booksCount !== 1 ? 's' : ''}</span>
          <div>
            <button class="edit">Edit</button>
            <button class="delete">Delete</button>
          </div>
        </div>
      </div>
    `;
    cards.insertBefore(card, cards.firstChild);

    // Wire 1.5s hover-to-expand
    let hoverTimer = null;
    card.addEventListener('mouseenter', () => {
        hoverTimer = setTimeout(() => card.classList.add('expanded'), 500);
    });
    card.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimer);
        card.classList.remove('expanded');
    });

    const counter = document.querySelector('.header p');
    if (counter) {
        const current = parseInt(counter.textContent, 10);
        if (!Number.isNaN(current)) {
            counter.textContent = `${current + 1} registered authors`;
        }
    }
}

/* ══════════════════════════════════════════════════════════════════
   AUTHOR FORM
══════════════════════════════════════════════════════════════════ */
function initAuthorForm() {
    const form = document.getElementById('addAuthorForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const modal = document.getElementById('addAuthorModal');
        const editId = modal && modal.dataset.editId;

        const name           = document.getElementById('authorName').value.trim();
        const slug           = document.getElementById('authorSlug').value.trim();
        const stats          = document.getElementById('authorStats').value.trim();
        const aboutTitle     = document.getElementById('authorAboutTitle').value.trim();
        const aboutText      = document.getElementById('authorAboutText').value.trim();
        const bannerImg      = document.getElementById('authorBannerImg').value.trim();
        const profileImgFile = document.getElementById('authorProfileImgFile').files[0];
        const booksInput     = document.getElementById('authorBooks').value.trim();
        const books          = normalizeAuthorBooks(booksInput);

        if (!name || !slug || !bannerImg) {
            alert('Please complete all required fields before submitting.');
            return;
        }
        if (!editId && !profileImgFile) {
            alert('Please select a profile image.');
            return;
        }

        const token = localStorage.getItem('maktabaToken');
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        try {
            let res;
            if (editId) {
                if (profileImgFile) {
                    const fd = new FormData();
                    fd.append('name', name);
                    fd.append('slug', slug);
                    fd.append('stats', stats);
                    fd.append('aboutTitle', aboutTitle);
                    fd.append('aboutText', aboutText);
                    fd.append('bannerImg', bannerImg);
                    fd.append('profileImg', profileImgFile);
                    if (books.length > 0) fd.append('books', JSON.stringify(books));
                    res = await fetch(ADMIN_API_BASE + '/api/authors/' + editId, {
                        method: 'PUT', headers: authHeaders, body: fd
                    });
                } else {
                    res = await fetch(ADMIN_API_BASE + '/api/authors/' + editId, {
                        method: 'PUT',
                        headers: { ...authHeaders, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, slug, stats, aboutTitle, aboutText, bannerImg, books })
                    });
                }
            } else {
                const fd = new FormData();
                fd.append('name', name);
                fd.append('slug', slug);
                fd.append('stats', stats);
                fd.append('aboutTitle', aboutTitle);
                fd.append('aboutText', aboutText);
                fd.append('bannerImg', bannerImg);
                fd.append('profileImg', profileImgFile);
                if (books.length > 0) fd.append('books', JSON.stringify(books));
                res = await fetch(ADMIN_API_BASE + '/api/authors', {
                    method: 'POST', headers: authHeaders, body: fd
                });
            }

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || data.message || `Failed to ${editId ? 'update' : 'add'} author.`);
                return;
            }

            closeAddAuthorModal();
            alert(editId ? 'Author updated successfully.' : 'Author added successfully.');
            loadAdminAuthors();
        } catch (err) {
            console.error('Author form error:', err);
            alert('Unable to save author. Check your network and try again.');
        }
    });
}

/* ══════════════════════════════════════════════════════════════════
   BOOK FORM
══════════════════════════════════════════════════════════════════ */
function initBookForm() {
    const form = document.getElementById('addBookForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title       = document.getElementById('bookTitle')?.value.trim();
        const author      = document.getElementById('bookAuthor')?.value.trim();
        const genre       = document.getElementById('bookGenre')?.value.trim();
        const year        = document.getElementById('bookYear')?.value;
        const price       = document.getElementById('bookPrice')?.value;
        const stock       = document.getElementById('bookStock')?.value;
        const salePercent = document.getElementById('bookSalePercent')?.value;
        const salePrice   = document.getElementById('bookSalePrice')?.value;
        const ISBN        = document.getElementById('bookISBN')?.value.trim() || '';
        const pages       = document.getElementById('bookPages')?.value || 0;
        const image       = document.getElementById('bookImage')?.value.trim() || '';
        const description = document.getElementById('bookDescription')?.value.trim() || '';
        const language    = document.getElementById('bookLanguage')?.value.trim() || 'English';
        const quote       = document.getElementById('bookQuote')?.value.trim() || '';

        if (!title || !author || !genre || !year || !price) {
            alert('Please complete all required fields.');
            return;
        }

        const modal  = document.getElementById('addBookModal');
        const editId = modal && modal.dataset.editId;

        try {
            const token = localStorage.getItem('maktabaToken');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const url    = editId ? ADMIN_API_BASE + '/books/id/' + editId : ADMIN_API_BASE + '/books';
            const method = editId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify({
                    title,
                    author,
                    genre,
                    year: Number(year),
                    price: Number(price),
                    stock: Number(stock) || 0,
                    salePercent: salePercent === '' ? 0 : Number(salePercent),
                    salePrice: salePrice === '' ? 0 : Number(salePrice),
                    ISBN,
                    pages: Number(pages),
                    image,
                    description,
                    language,
                    quote,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || data.message || 'Failed to save book.');
                return;
            }

            if (modal) delete modal.dataset.editId;
            closeAddBookModal();
            alert(editId ? `"${data.title}" updated.` : `"${data.title}" added.`);
            loadAdminBooks();
        } catch (err) {
            console.error('Save book failed:', err);
            alert('Unable to save book. Check your network and try again.');
        }
    });
}

/* ══════════════════════════════════════════════════════════════════
   ADMIN BOOKS TABLE — dynamic load + edit/delete
══════════════════════════════════════════════════════════════════ */
const BOOK_COLORS = ['yellow','red','green','brown','blue','purple','orange','teal'];
let _adminBooksCache = [];

async function loadAdminBooks() {
    const tbody   = document.getElementById('books-tbody');
    const countEl = document.getElementById('books-count');
    if (!tbody) return;

    try {
        const res   = await fetch(ADMIN_API_BASE + '/books');
        const books = await res.json();
        const list  = Array.isArray(books) ? books : (books.books || []);
        _adminBooksCache = list;

        if (countEl) countEl.textContent = list.length + ' title' + (list.length !== 1 ? 's' : '') + ' in the collection';

        tbody.innerHTML = list.length === 0
            ? '<tr><td colspan="8" style="text-align:center;padding:24px;color:#888;">No books found.</td></tr>'
            : list.map((b, i) => {
                const color = BOOK_COLORS[i % BOOK_COLORS.length];
                const imgEl = b.image
                    ? `<img src="${b.image}" alt="${b.title}" style="width:32px;height:44px;object-fit:cover;border-radius:3px;">`
                    : `<span class="color-box ${color}"></span>`;
                const price       = Number(b.price || 0);
                const salePrice   = Number(b.salePrice || 0);
                const salePercent = Number(b.salePercent || 0);
                const onSale      = salePercent > 0 || (salePrice > 0 && salePrice < price);
                const saleDisplay = salePrice > 0
                    ? salePrice
                    : (salePercent > 0 && price > 0 ? Number((price * (1 - salePercent / 100)).toFixed(2)) : 0);
                return `
                <tr data-id="${b._id}">
                  <td>${imgEl}</td>
                  <td>${b.title}</td>
                  <td>${b.author}</td>
                  <td><span class="tag">${b.genre}</span></td>
                  <td>${b.year || '—'}</td>
                  <td class="price">
                    ${onSale ? `
                      <div style="display:grid;gap:2px;">
                        <span style="text-decoration:line-through;color:#888;font-size:11px;">L.E ${price.toFixed(2)}</span>
                        <strong style="color:#c0392b;font-size:13px;">L.E ${saleDisplay.toFixed(2)}</strong>
                        <span style="display:inline-flex;align-items:center;justify-content:center;background:#c0392b;color:#fff;border-radius:999px;padding:2px 8px;font-size:10px;font-weight:600;width:max-content;">ON SALE</span>
                      </div>
                    ` : `L.E ${price.toFixed(2)}`}
                  </td>
                  <td>${b.stock != null ? b.stock : '—'}</td>
                  <td>
                    <button class="edit" onclick="openEditBookModal('${b._id}')">Edit</button>
                    <button class="delete" onclick="deleteBook('${b._id}')">Delete</button>
                  </td>
                </tr>`;
            }).join('');

        // wire search
        const searchEl = document.querySelector('.search');
        if (searchEl && !searchEl._wired) {
            searchEl._wired = true;
            searchEl.addEventListener('input', () => {
                const q = searchEl.value.toLowerCase();
                tbody.querySelectorAll('tr[data-id]').forEach(tr => {
                    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
                });
            });
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:#c0392b;">Failed to load books.</td></tr>';
    }
}

async function deleteBook(id) {
    if (!confirm('Delete this book? This cannot be undone.')) return;
    try {
        const token = localStorage.getItem('maktabaToken');
        const res   = await fetch(ADMIN_API_BASE + '/books/id/' + id, {
            method: 'DELETE',
            headers: token ? { Authorization: 'Bearer ' + token } : {}
        });
        if (res.ok) {
            const row = document.querySelector('tr[data-id="' + id + '"]');
            if (row) row.remove();
            const countEl = document.getElementById('books-count');
            if (countEl) {
                const n = parseInt(countEl.textContent) - 1;
                countEl.textContent = n + ' title' + (n !== 1 ? 's' : '') + ' in the collection';
            }
        } else {
            const d = await res.json().catch(() => ({}));
            alert(d.error || 'Delete failed.');
        }
    } catch (err) { alert('Network error.'); }
}

function openEditBookModal(id) {
    const modal = document.getElementById('addBookModal');
    if (!modal) return;
    const b = _adminBooksCache.find(x => x._id === id);
    if (!b) { alert('Book data not found — try refreshing the page.'); return; }

    const h2 = modal.querySelector('.modal-header h2');
    if (h2) h2.textContent = 'Edit Book';
    document.getElementById('bookTitle').value       = b.title       || '';
    document.getElementById('bookAuthor').value      = b.author      || '';
    document.getElementById('bookGenre').value       = b.genre       || '';
    document.getElementById('bookYear').value        = b.year        || '';
    document.getElementById('bookPrice').value       = b.price       || '';
    document.getElementById('bookStock').value       = b.stock != null ? b.stock : '';
    document.getElementById('bookSalePercent').value = b.salePercent != null ? b.salePercent : 0;
    document.getElementById('bookSalePrice').value   = b.salePrice   != null ? b.salePrice : 0;
    document.getElementById('bookISBN').value        = b.ISBN        || '';
    document.getElementById('bookPages').value       = b.pages       || '';
    document.getElementById('bookImage').value       = b.image       || '';
    document.getElementById('bookDescription').value = b.description || '';
    document.getElementById('bookLanguage').value    = b.language    || 'English';
    document.getElementById('bookQuote').value       = b.quote       || '';
    modal.dataset.editId = id;
    modal.classList.add('show');
}

/* ══════════════════════════════════════════════════════════════════
   ADMIN AUTHORS CARDS — dynamic load + edit/delete
══════════════════════════════════════════════════════════════════ */
let _adminAuthorsCache = [];

async function loadAdminAuthors() {
    const cards   = document.getElementById('authors-cards');
    const countEl = document.getElementById('authors-count');
    if (!cards) return;

    try {
        const token   = localStorage.getItem('maktabaToken');
        const headers = token ? { Authorization: 'Bearer ' + token } : {};
        const res     = await fetch(ADMIN_API_BASE + '/api/authors', { headers });
        const data    = await res.json();
        const list    = Array.isArray(data) ? data : (data.authors || []);
        _adminAuthorsCache = list;

        if (countEl) countEl.textContent = list.length + ' registered author' + (list.length !== 1 ? 's' : '');

        if (list.length === 0) {
            cards.innerHTML = '<p style="padding:24px;color:#888;">No authors found.</p>';
            return;
        }

        cards.innerHTML = list.map(a => {
            const initial    = (a.name || '?').charAt(0).toUpperCase();
            const booksCount = Array.isArray(a.books) ? a.books.length : 0;
            const sub        = [a.nationality, a.birthYear].filter(Boolean).join(' - ');
            return `
            <div class="card" data-id="${a._id}">
              <div class="avatar">${initial}</div>
              <div class="info">
                <h3>${a.name}</h3>
                ${sub ? `<p class="sub">${sub}</p>` : ''}
                <p class="desc">${a.aboutText || ''}</p>
                <div class="bottom">
                  <span class="books">${booksCount} book${booksCount !== 1 ? 's' : ''}</span>
                  <div>
                    <button class="edit" onclick="openEditAuthorModal('${a._id}')">Edit</button>
                    <button class="delete" onclick="deleteAuthor('${a._id}')">Delete</button>
                  </div>
                </div>
              </div>
            </div>`;
        }).join('');

        // Wire 0.5s hover-to-expand on each author card
        cards.querySelectorAll('.card[data-id]').forEach(card => {
            let hoverTimer = null;

            card.addEventListener('mouseenter', () => {
                hoverTimer = setTimeout(() => {
                    card.classList.add('expanded');
                }, 500);
            });

            card.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimer);
                card.classList.remove('expanded');
            });
        });

        // wire search
        const searchEl = document.querySelector('.search');
        if (searchEl && !searchEl._wired) {
            searchEl._wired = true;
            searchEl.addEventListener('input', () => {
                const q = searchEl.value.toLowerCase();
                cards.querySelectorAll('.card[data-id]').forEach(c => {
                    c.style.display = c.textContent.toLowerCase().includes(q) ? '' : 'none';
                });
            });
        }
    } catch (err) {
        cards.innerHTML = '<p style="padding:24px;color:#c0392b;">Failed to load authors.</p>';
    }
}

function openEditAuthorModal(id) {
    const modal = document.getElementById('addAuthorModal');
    if (!modal) return;
    const a = _adminAuthorsCache.find(x => x._id === id);
    if (!a) { alert('Author data not found — try refreshing the page.'); return; }

    const h2 = modal.querySelector('.modal-header h2');
    if (h2) h2.textContent = 'Edit Author';
    document.getElementById('authorName').value       = a.name       || '';
    document.getElementById('authorSlug').value       = a.slug       || '';
    document.getElementById('authorStats').value      = a.stats      || '';
    document.getElementById('authorAboutTitle').value = a.aboutTitle || '';
    document.getElementById('authorAboutText').value  = a.aboutText  || '';
    document.getElementById('authorBannerImg').value  = a.bannerImg  || '';
    document.getElementById('authorBooks').value      = Array.isArray(a.books) ? a.books.join(', ') : '';

    const profileField = document.getElementById('authorProfileImgFile');
    if (profileField) profileField.removeAttribute('required');

    modal.dataset.editId = id;
    modal.classList.add('show');
}

async function deleteAuthor(id) {
    if (!confirm('Delete this author? This cannot be undone.')) return;
    try {
        const token = localStorage.getItem('maktabaToken');
        const res   = await fetch(ADMIN_API_BASE + '/api/authors/' + id, {
            method: 'DELETE',
            headers: token ? { Authorization: 'Bearer ' + token } : {}
        });
        if (res.ok) {
            loadAdminAuthors();
        } else {
            const d = await res.json().catch(() => ({}));
            alert(d.error || 'Delete failed.');
        }
    } catch (err) { alert('Network error.'); }
}

/* ══════════════════════════════════════════════════════════════════
   INIT — Admin guard + modal wiring + data load
══════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    // Admin guard — redirect non-admins away from admin pages
    if (document.body.classList.contains('admin-dashboard-page')) {
        const token = localStorage.getItem('maktabaToken');
        const role  = localStorage.getItem('maktabaUserRole');
        if (!token || role !== 'admin') {
            window.location.href = '/signin';
            return;
        }
    }

    window.addEventListener('click', (event) => {
        const bookModal   = document.getElementById('addBookModal');
        const authorModal = document.getElementById('addAuthorModal');
        if (bookModal   && event.target === bookModal)   closeAddBookModal();
        if (authorModal && event.target === authorModal) closeAddAuthorModal();
    });

    initAuthorForm();
    initBookForm();
    loadAdminBooks();
    loadAdminAuthors();
});

/* ══════════════════════════════════════════════════════════════════
   CHARTS & DASHBOARD WIDGETS
══════════════════════════════════════════════════════════════════ */

/*---- Revenue Chart ----*/
window.addEventListener('load', function () {
    const labels  = ['Jul 24','Aug','Sep','Oct','Nov','Dec 24','Jan','Feb','Mar','Apr','May','Jun 25'];
    const revenue = [1800,2200,3500,5200,3800,4100,3200,3600,4400,5000,5800,6200];
    const sold    = [40,55,90,130,95,105,80,90,110,125,145,155];
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: { labels, datasets: [
            { label: 'Book Revenue', data: revenue, borderColor: '#C8A96E', backgroundColor: 'rgba(200,169,110,0.15)', borderWidth: 2, fill: true, tension: 0.45, pointRadius: 0 },
            { label: 'Orders', data: sold.map(v => v * 35), borderColor: '#3B5E2F', backgroundColor: 'rgba(59,94,47,0.12)', borderWidth: 2, fill: true, tension: 0.45, pointRadius: 0 }
        ]},
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v } } } }
    });
});

/*---- Genre Breakdown ----*/
window.addEventListener('load', function () {
    const defaultGenres = [
        { label: 'Historical Fiction',  pct: 28, color: '#C0392B' },
        { label: 'Literary Fiction',    pct: 22, color: '#2471A3' },
        { label: 'Poetry / Philosophy', pct: 18, color: '#1E8449' },
        { label: 'Social Realism',      pct: 15, color: '#D4AC0D' },
        { label: 'Romantic Fiction',    pct: 10, color: '#6C3483' },
        { label: 'Post-colonial',       pct: 7,  color: '#784212' },
    ];
    const genres = Array.isArray(window.genreBreakdownData) && window.genreBreakdownData.length > 0
        ? window.genreBreakdownData.slice(0, 6).map((item, index) => ({
            label: item.genre,
            pct:   Math.round((item.pct || 0) * 10) / 10,
            color: defaultGenres[index]?.color || ['#C0392B','#2471A3','#1E8449','#D4AC0D','#6C3483','#784212'][index % 6],
        }))
        : defaultGenres;

    const legend = document.getElementById('genreLegend');
    if (legend) {
        legend.innerHTML = genres.map(g => `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:9px;height:9px;border-radius:50%;background:${g.color};flex-shrink:0;"></div>
            <span style="font-size:12px;color:#888;">${g.label}</span>
          </div>
          <span style="font-size:12px;font-weight:500;">${g.pct}%</span>
        </div>`).join('');
    }

    const ctx = document.getElementById('genreChart');
    if (!ctx) return;

    if (window.genreChartInstance) {
        try { window.genreChartInstance.destroy(); } catch (e) {}
    }

    window.genreChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: genres.map(g => g.label),
            datasets: [{
                data:            genres.map(g => g.pct),
                backgroundColor: genres.map(g => g.color),
                borderWidth:     2,
                borderColor:     '#fff',
                hoverOffset:     4,
            }],
        },
        options: {
            responsive:          false,
            maintainAspectRatio: true,
            cutout: '60%',
            plugins: {
                legend:  { display: false },
                tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` } },
            },
        },
    });
});

/*---- Low Stock ----*/
window.addEventListener('load', function () {
    const books = [
        { title: 'Season of Migrat...', author: 'Salih',  color: '#2C3E50', left: 7,  danger: true  },
        { title: 'The Cairo Trilogy',   author: 'Mahfouz', color: '#922B21', left: 10, danger: false },
        { title: 'Broken Wings',        author: 'Gibran',  color: '#4A4A4A', left: 18, danger: false },
        { title: 'Palace Walk',         author: 'Mahfouz', color: '#B7950B', left: 24, danger: false },
        { title: 'Midaq Alley',         author: 'Mahfouz', color: '#6C3483', left: 31, danger: false },
    ];
    const card = document.getElementById('lowStockCard');
    if (!card) return;
    let rows = '';
    books.forEach((book, i) => {
        const isLast     = i === books.length - 1;
        const badgeColor = book.danger ? '#C0392B' : '#B7770D';
        rows += `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;${isLast ? '' : 'border-bottom:0.5px solid #eee;'}"><div style="display:flex;align-items:center;gap:12px;"><div style="width:28px;height:36px;border-radius:3px;background:${book.color};flex-shrink:0;"></div><div><p style="font-size:13px;font-weight:500;margin:0 0 2px;">${book.title}</p><p style="font-size:11px;color:#888;margin:0;">${book.author}</p></div></div><span style="font-size:11px;font-weight:500;color:${badgeColor};">${book.left} left</span></div>`;
    });
    card.innerHTML = `<p style="font-size:14px;font-weight:500;margin:0 0 2px;">⚠️ Low Stock</p><p style="font-size:11px;color:#888;margin:0 0 1rem;">Titles needing restock</p>${rows}`;
});

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD STATS — load, render charts, recent orders, low stock
══════════════════════════════════════════════════════════════════ */
const DASHBOARD_API_BASE = window.location.origin;

async function loadDashboardStats() {
  const token = localStorage.getItem('maktabaToken');

  if (!token) {
    console.warn('[Dashboard] No maktabaToken found in localStorage. ' +
      'Make sure you are logged in via the admin login page.');
    ['stat-new-books', 'stat-new-authors', 'stat-orders-note', 'stat-low-stock-count', 'stat-users-note']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = 'not logged in';
      });
    return;
  }

  try {
    const res = await fetch(`${DASHBOARD_API_BASE}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('[Dashboard] API error:', res.status, body);
      ['stat-new-books', 'stat-new-authors', 'stat-orders-note', 'stat-low-stock-count', 'stat-users-note']
        .forEach(id => {
          const el = document.getElementById(id);
          if (el) el.textContent = `error ${res.status}`;
        });
      return;
    }

    const { stats } = await res.json();

    // ── Stat cards ────────────────────────────────────────────────
    document.getElementById('stat-total-books').textContent = stats.totalBooks;
    document.getElementById('stat-new-books').textContent =
      stats.newBooksThisMonth > 0
        ? `+${stats.newBooksThisMonth} this month`
        : 'no new books this month';

    document.getElementById('stat-total-authors').textContent = stats.totalAuthors;
    document.getElementById('stat-new-authors').textContent =
      stats.authorsAddedThisMonth > 0
        ? `+${stats.authorsAddedThisMonth} this month`
        : 'no new authors this month';

    document.getElementById('stat-total-orders').textContent = stats.totalOrders;
    document.getElementById('stat-orders-note').textContent =
      `${Array.isArray(stats.recentOrders) ? stats.recentOrders.length : 0} recent order${Array.isArray(stats.recentOrders) && stats.recentOrders.length === 1 ? '' : 's'} shown`;
    const revenueOrders = document.getElementById('revenue-total-orders');
    if (revenueOrders) revenueOrders.textContent = stats.totalOrders;

    document.getElementById('stat-total-stock').textContent = stats.totalStock;
    document.getElementById('stat-low-stock-count').textContent =
      `${stats.lowStockBooks.length} low-stock item${stats.lowStockBooks.length !== 1 ? 's' : ''}`;

    document.getElementById('stat-total-users').textContent = stats.totalUsers;
    document.getElementById('stat-users-note').textContent = 'registered accounts';

    if (Array.isArray(stats.genreBreakdown) && stats.genreBreakdown.length > 0) {
      renderGenreBreakdownChart(stats.genreBreakdown);
    }

    renderRecentOrders(Array.isArray(stats.recentOrders) ? stats.recentOrders : []);

    // ── Low Stock widget ──────────────────────────────────────────
    if (stats.lowStockBooks.length > 0) {
      const card = document.getElementById('lowStockCard');
      if (!card) return;

      const spineColors = ['#2C3E50', '#922B21', '#4A4A4A', '#B7950B', '#6C3483'];
      let rows = '';
      stats.lowStockBooks.forEach((book, i) => {
        const isLast     = i === stats.lowStockBooks.length - 1;
        const spineColor = book.coverColor || spineColors[i % spineColors.length];
        const badgeColor = book.stock <= 7 ? '#C0392B' : '#B7770D';
        rows += `
          <div style="display:flex;align-items:center;justify-content:space-between;
                      padding:10px 0;${isLast ? '' : 'border-bottom:0.5px solid #eee;'}">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:28px;height:36px;border-radius:3px;
                          background:${spineColor};flex-shrink:0;"></div>
              <div>
                <p style="font-size:13px;font-weight:500;margin:0 0 2px;">
                  ${book.title.length > 18 ? book.title.slice(0, 17) + '…' : book.title}
                </p>
                <p style="font-size:11px;color:#888;margin:0;">${book.author}</p>
              </div>
            </div>
            <span style="font-size:11px;font-weight:500;color:${badgeColor};">
              ${book.stock} left
            </span>
          </div>`;
      });

      card.innerHTML = `
        <p style="font-size:14px;font-weight:500;margin:0 0 2px;">⚠️ Low Stock</p>
        <p style="font-size:11px;color:#888;margin:0 0 1rem;">Titles needing restock</p>
        ${rows}`;
    }

  } catch (err) {
    console.error('[Dashboard] Fetch failed:', err);
    ['stat-new-books', 'stat-new-authors', 'stat-orders-note', 'stat-low-stock-count', 'stat-users-note']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = 'fetch failed';
      });
  }
}

function renderGenreBreakdownChart(genreBreakdown) {
  const chartEl  = document.getElementById('genreChart');
  const legendEl = document.getElementById('genreLegend');
  if (!chartEl || !legendEl || !Array.isArray(genreBreakdown)) return;

  const colors = ['#C0392B', '#2471A3', '#1E8449', '#D4AC0D', '#6C3483', '#784212', '#117A65', '#7D3C98'];
  const data   = genreBreakdown.slice(0, 6).map((item, index) => ({
    label: item.genre,
    pct:   Math.round((item.pct || 0) * 10) / 10,
    color: colors[index % colors.length],
  }));

  legendEl.innerHTML = data.map(item => `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:6px;">
        <div style="width:9px;height:9px;border-radius:50%;background:${item.color};flex-shrink:0;"></div>
        <span style="font-size:12px;color:#888;">${item.label}</span>
      </div>
      <span style="font-size:12px;font-weight:500;">${item.pct}%</span>
    </div>`).join('');

  if (window.genreChartInstance) {
    try { window.genreChartInstance.destroy(); } catch (e) {}
  }

  window.genreChartInstance = new Chart(chartEl.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels:   data.map(item => item.label),
      datasets: [{
        data:            data.map(item => item.pct),
        backgroundColor: data.map(item => item.color),
        borderWidth:     2,
        borderColor:     '#fff',
        hoverOffset:     4,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend:  { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` } },
      },
    },
  });
}

function renderRecentOrders(recentOrders) {
  const card = document.getElementById('recentOrdersCard');
  if (!card) return;

  if (!Array.isArray(recentOrders) || recentOrders.length === 0) {
    card.innerHTML = `
      <p style="font-size:14px;font-weight:500;margin:0 0 2px;">Recent Orders</p>
      <p style="font-size:11px;color:#888;margin:0 0 1rem;">Latest customer orders</p>
      <p style="margin:0;color:#888;font-size:12px;">No orders yet.</p>`;
    return;
  }

  const statusOptions = ['processing', 'successful', 'rejected', 'shipped', 'delivered', 'cancelled'];
  const statusColors  = {
    processing: { bg: 'rgba(195,57,48,0.1)',   color: '#c0392b' },
    successful: { bg: 'rgba(39,174,96,0.12)',  color: '#1e8449' },
    rejected:   { bg: 'rgba(100,100,100,0.1)', color: '#555'    },
    shipped:    { bg: 'rgba(41,128,185,0.1)',  color: '#2471a3' },
    delivered:  { bg: 'rgba(39,174,96,0.12)',  color: '#1e8449' },
    cancelled:  { bg: 'rgba(100,100,100,0.1)', color: '#555'    },
  };

  const rows = recentOrders.map(order => {
    const createdAt  = order.createdAt ? new Date(order.createdAt) : null;
    const dateText   = createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Unknown date';
    const status     = String(order.orderStatus || 'processing');
    const itemsCount = Number(order.itemsCount || 0);
    const sc         = statusColors[status] || statusColors.processing;

    const optionsHtml = statusOptions.map(s =>
      `<option value="${s}" ${s === status ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
    ).join('');

    return `
      <div class="recent-order-row" data-order-id="${order._id}">
        <div class="recent-order-main">
          <strong>${order.orderNumber || 'Order'}</strong>
          <span>${order.userEmail || 'Unknown customer'}</span>
        </div>
        <div class="recent-order-meta">
          <span>${itemsCount} unit${itemsCount === 1 ? '' : 's'}</span>
          <span>L.E ${Number(order.totalAmount || 0).toFixed(2)}</span>
          <select class="order-status-select" data-order-id="${order._id}"
            style="background:${sc.bg};color:${sc.color};border:1px solid ${sc.color}33;
                   border-radius:999px;padding:2px 8px;font-size:10px;font-weight:600;
                   font-family:inherit;cursor:pointer;outline:none;appearance:none;
                   -webkit-appearance:none;text-align:center;">
            ${optionsHtml}
          </select>
          <span>${dateText}</span>
        </div>
      </div>`;
  }).join('');

  card.innerHTML = `
    <p style="font-size:14px;font-weight:500;margin:0 0 2px;">Recent Orders</p>
    <p style="font-size:11px;color:#888;margin:0 0 1rem;">Latest customer orders</p>
    <div class="recent-orders-list">${rows}</div>`;

  // Wire change handlers
  card.querySelectorAll('.order-status-select').forEach(sel => {
    sel.addEventListener('change', async function () {
      const orderId   = this.dataset.orderId;
      const newStatus = this.value;
      const sc        = statusColors[newStatus] || statusColors.processing;

      // Optimistic UI update
      this.style.background  = sc.bg;
      this.style.color       = sc.color;
      this.style.borderColor = sc.color + '33';

      try {
        const token = localStorage.getItem('maktabaToken');
        const res   = await fetch(DASHBOARD_API_BASE + '/api/orders/' + orderId + '/status', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body:    JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || 'Failed to update status.');
          loadDashboardStats();
        }
      } catch (err) {
        alert('Network error — could not update status.');
        loadDashboardStats();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', loadDashboardStats);
