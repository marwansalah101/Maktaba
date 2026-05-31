// ═══════════════════════════════════════════════════════════════
//  GOOGLE SIGN IN  (must be outside the IIFE so onclick can reach it)
// ═══════════════════════════════════════════════════════════════

function initGoogleSignIn() {
    if (typeof google === 'undefined') return;
    google.accounts.id.initialize({
        client_id: '359427593568-fp7894cehclcd6e1fnke49ca2norscai.apps.googleusercontent.com',
        callback: handleGoogleResponse
    });
}

function handleGoogleResponse(response) {
    const base64  = response.credential.split('.')[1];
    const decoded = JSON.parse(atob(base64));

    const googleUser = {
        fullname: decoded.name,
        email:    decoded.email,
        picture:  decoded.picture,
        provider: 'google'
    };

    const users = JSON.parse(localStorage.getItem('maktabaUsers') || '[]');
    const existingUser = users.find(u => u.email === googleUser.email);
    if (!existingUser) {
        users.push(googleUser);
        localStorage.setItem('maktabaUsers', JSON.stringify(users));
    }

    localStorage.setItem('maktabaLoggedInUser', JSON.stringify({
        fullname: googleUser.fullname,
        email:    googleUser.email,
        picture:  googleUser.picture
    }));
    localStorage.setItem('maktabaUserName',  googleUser.fullname);
    localStorage.setItem('maktabaUserEmail', googleUser.email);

    window.location.href = 'http://127.0.0.1:5501/views/pages/home(fares)/home.html';
}

function googleSignIn() {
    if (typeof google === 'undefined') {
        alert('Google Sign-In is not loaded yet. Please wait a moment and try again.');
        return;
    }
    google.accounts.id.prompt();
}


// ═══════════════════════════════════════════════════════════════
//  MAIN AUTH MODULE
// ═══════════════════════════════════════════════════════════════
(() => {

    // ─── Validation Rules ───────────────────────────────────────────
    const rules = {
        fullname: {
            validate: v => v.trim().length >= 2,
            message: 'Please enter your full name.'
        },
        email: {
            validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
            message: 'Please enter a valid e-mail address.'
        },
        password_signup: {
            validate: v => v.length >= 8,
            message: 'Password must be at least 8 characters.'
        },
        password_signin: {
            validate: v => v.length > 0,
            message: 'Please enter your password.'
        }
    };

    // ─── UI Helpers ─────────────────────────────────────────────────
    function showError(inputEl, msg) {
        inputEl.classList.add('error');
        inputEl.classList.remove('valid');
        const err = document.getElementById(inputEl.id + '-error');
        if (err) { err.textContent = msg; err.classList.add('show'); }
    }

    function showValid(inputEl) {
        inputEl.classList.remove('error');
        inputEl.classList.add('valid');
        const err = document.getElementById(inputEl.id + '-error');
        if (err) { err.textContent = ''; err.classList.remove('show'); }
    }

    function clearState(inputEl) {
        inputEl.classList.remove('error', 'valid');
        const err = document.getElementById(inputEl.id + '-error');
        if (err) { err.textContent = ''; err.classList.remove('show'); }
    }

    // ─── Password Strength ──────────────────────────────────────────
    function getPasswordStrength(pw) {
        let score = 0;
        if (pw.length >= 8)  score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
        if (/[0-9]/.test(pw))      score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        return Math.min(4, score);
    }

    function updateStrengthBars(pw) {
        const bars = document.querySelectorAll('.strength-bar');
        if (!bars.length) return;
        const score = getPasswordStrength(pw);
        const cls = score <= 1 ? 'weak' : score <= 2 ? 'medium' : 'strong';
        bars.forEach((bar, i) => {
            bar.classList.remove('weak', 'medium', 'strong');
            if (i < score) bar.classList.add(cls);
        });
    }

    // ─── Toggle Password Visibility ─────────────────────────────────
    function setupTogglePassword() {
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const input = document.getElementById(targetId);
                if (!input) return;
                const isHidden = input.type === 'password';
                input.type = isHidden ? 'text' : 'password';
                const eyeIcon = btn.querySelector('svg');
                if (!eyeIcon) return;
                if (isHidden) {
                    eyeIcon.innerHTML = `
                        <line x1="1" y1="1" x2="23" y2="23"/>
                        <path d="M10.94 6.08A6.93 6.93 0 0 1 12 6c3.18 0 6.17 2.29 7.76 6a15.23 15.23 0 0 1-.9 1.64"/>
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2.24 12c1.59 3.71 4.58 6 7.76 6a9.022 9.022 0 0 0 5.24-1.7"/>
                        <line x1="12" y1="9" x2="12" y2="9"/>`;
                } else {
                    eyeIcon.innerHTML = `
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>`;
                }
            });
        });
    }


    // ═══════════════════════════════════════════════════════════════
    //  SIGN UP
    // ═══════════════════════════════════════════════════════════════
    function initSignup() {
        const form = document.getElementById('signupForm');
        if (!form) return;

        const fullnameEl = document.getElementById('fullname');
        const emailEl    = document.getElementById('email');
        const passwordEl = document.getElementById('password');

        fullnameEl && fullnameEl.addEventListener('blur', () => {
            if (!fullnameEl.value.trim()) { clearState(fullnameEl); return; }
            rules.fullname.validate(fullnameEl.value)
                ? showValid(fullnameEl)
                : showError(fullnameEl, rules.fullname.message);
        });

        emailEl && emailEl.addEventListener('blur', () => {
            if (!emailEl.value.trim()) { clearState(emailEl); return; }
            rules.email.validate(emailEl.value)
                ? showValid(emailEl)
                : showError(emailEl, rules.email.message);
        });

        passwordEl && passwordEl.addEventListener('input', () => {
            updateStrengthBars(passwordEl.value);
            if (passwordEl.value.length > 0) {
                rules.password_signup.validate(passwordEl.value)
                    ? showValid(passwordEl)
                    : showError(passwordEl, rules.password_signup.message);
            } else {
                clearState(passwordEl);
            }
        });

        form.addEventListener('submit', e => {
            e.preventDefault();
            let valid = true;

            if (!fullnameEl.value.trim() || !rules.fullname.validate(fullnameEl.value)) {
                showError(fullnameEl, rules.fullname.message); valid = false;
            }
            if (!emailEl.value.trim() || !rules.email.validate(emailEl.value)) {
                showError(emailEl, rules.email.message); valid = false;
            }
            if (!passwordEl.value || !rules.password_signup.validate(passwordEl.value)) {
                showError(passwordEl, rules.password_signup.message); valid = false;
            }

            if (!valid) return;

            const btn = form.querySelector('.btn-primary');
            btn.textContent = 'Creating account…';
            btn.disabled = true;

            const users = JSON.parse(localStorage.getItem('maktabaUsers') || '[]');
            const exists = users.some(
                u => u.email.toLowerCase() === emailEl.value.trim().toLowerCase()
            );
            if (exists) {
                showError(emailEl, 'An account with this email already exists.');
                btn.textContent = 'Sign Up';
                btn.disabled = false;
                return;
            }

            const newUser = {
                fullname: fullnameEl.value.trim(),
                email:    emailEl.value.trim().toLowerCase(),
                password: passwordEl.value
            };

            users.push(newUser);
            localStorage.setItem('maktabaUsers', JSON.stringify(users));

            setTimeout(() => {
                btn.textContent = 'Sign Up';
                btn.disabled = false;
                window.location.href = './signin.html';
            }, 1000);
        });
    }




function toggleDarkMode() {
  const card = document.querySelector('.signup-card');
  const icon = document.getElementById('dark-icon');
  card.classList.toggle('dark');

  if (card.classList.contains('dark')) {
    icon.innerHTML = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
  } else {
    icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
  }

  localStorage.setItem('maktabaDarkMode', card.classList.contains('dark'));
}

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('maktabaDarkMode') === 'true') {
    toggleDarkMode();
  }
});

    
    // ═══════════════════════════════════════════════════════════════
    //  SIGN IN
    // ═══════════════════════════════════════════════════════════════
    function initSignin() {
        const form = document.getElementById('signinForm');
        if (!form) return;

        const emailEl    = document.getElementById('email');
        const passwordEl = document.getElementById('password');

        emailEl && emailEl.addEventListener('blur', () => {
            if (!emailEl.value.trim()) { clearState(emailEl); return; }
            rules.email.validate(emailEl.value)
                ? showValid(emailEl)
                : showError(emailEl, rules.email.message);
        });

        passwordEl && passwordEl.addEventListener('blur', () => {
            rules.password_signin.validate(passwordEl.value)
                ? showValid(passwordEl)
                : showError(passwordEl, rules.password_signin.message);
        });

        form.addEventListener('submit', e => {
            e.preventDefault();
            let valid = true;

            if (!emailEl.value.trim() || !rules.email.validate(emailEl.value)) {
                showError(emailEl, rules.email.message); valid = false;
            }
            if (!rules.password_signin.validate(passwordEl.value)) {
                showError(passwordEl, rules.password_signin.message); valid = false;
            }

            if (!valid) return;

            const btn = form.querySelector('.btn-primary');
            btn.textContent = 'Signing in...';
            btn.disabled = true;

            const users = JSON.parse(localStorage.getItem('maktabaUsers') || '[]');
            const user = users.find(
                u => u.email === emailEl.value.trim().toLowerCase()
            );

            if (!user) {
                showError(emailEl, 'No account found with this email.');
                btn.textContent = 'Sign In';
                btn.disabled = false;
                return;
            }

            if (user.password !== passwordEl.value) {
                showError(passwordEl, 'Incorrect password.');
                btn.textContent = 'Sign In';
                btn.disabled = false;
                return;
            }

            localStorage.setItem('maktabaLoggedInUser', JSON.stringify({
                fullname: user.fullname,
                email:    user.email,
                role:     'user'
            }));
            localStorage.setItem('maktabaUserRole',  'user');
            localStorage.setItem('maktabaUserEmail', user.email);
            localStorage.setItem('maktabaUserName',  user.fullname);

            setTimeout(() => {
                btn.textContent = 'Sign In';
                btn.disabled = false;
                window.location.href = 'http://127.0.0.1:5501/views/pages/home(fares)/home.html';
            }, 1000);
        });
    }


    // ─── Welcome Overlay ────────────────────────────────────────────
    window.addEventListener('DOMContentLoaded', () => {
        const justLoggedIn = sessionStorage.getItem('justLoggedIn');
        const name = localStorage.getItem('maktabaUserName');
        if (justLoggedIn && name) {
            const overlay = document.getElementById('welcomeOverlay');
            const welcomeText = document.getElementById('welcomeText');
            if (overlay && welcomeText) {
                welcomeText.textContent = `Welcome, ${name} 👋`;
                overlay.style.display = 'flex';
                setTimeout(() => {
                    overlay.style.display = 'none';
                    sessionStorage.removeItem('justLoggedIn');
                }, 2500);
            }
        }
    });

    // ─── Init ────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        setupTogglePassword();
        initSignup();
        initSignin();
        initGoogleSignIn();
    });

})();


/* ══════════════════════════════════════════════════════════════════
   FORGOT PASSWORD
══════════════════════════════════════════════════════════════════ */
function openForgotPw() {
    const overlay = document.getElementById('fp-modal-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
    document.getElementById('fp-form-wrap').style.display = '';
    document.getElementById('fp-success').style.display = 'none';
    const emailEl = document.getElementById('fp-email');
    if (emailEl) { emailEl.value = ''; emailEl.classList.remove('error', 'valid'); }
    const errEl = document.getElementById('fp-error');
    if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }
}

function closeForgotPw() {
    const overlay = document.getElementById('fp-modal-overlay');
    if (overlay) overlay.classList.remove('open');
}

function submitForgotPw(e) {
    e.preventDefault();
    const emailEl = document.getElementById('fp-email');
    const errEl   = document.getElementById('fp-error');
    const email   = emailEl ? emailEl.value.trim() : '';

    errEl.textContent = '';
    errEl.classList.remove('show');
    emailEl.classList.remove('error', 'valid');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailEl.classList.add('error');
        errEl.textContent = 'Please enter a valid e-mail address.';
        errEl.classList.add('show');
        return;
    }

    document.getElementById('fp-form-wrap').style.display = 'none';
    document.getElementById('fp-sent-email').textContent = email;
    document.getElementById('fp-success').style.display = 'block';
}


/* ══════════════════════════════════════════════════════════════════
   DASHBOARD NAVIGATION
══════════════════════════════════════════════════════════════════ */
function goToAuthors() { window.location.href = './totalauth.html'; }
function goToBooks()   { window.location.href = './authbooks.html'; }
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
    if (modal) modal.classList.remove('show');
}
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('addBookModal');
        if (modal && event.target === modal) closeAddBookModal();
    });
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

/*---- Weekly Visitors ----*/
window.addEventListener('load', function () {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const visits = [320, 410, 350, 510, 600, 890, 430];
    const peak = visits.indexOf(Math.max(...visits));
    const peakEl = document.getElementById('peakDay');
    if (peakEl) peakEl.textContent = `${days[peak]}: ${visits[peak]}`;
    const ctx = document.getElementById('visitorsChart');
    if (!ctx) return;
    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: { labels: days, datasets: [{ label: 'Visitors', data: visits, backgroundColor: visits.map((v, i) => i === peak ? '#1B2E4B' : '#2C4A72'), borderRadius: 4, borderSkipped: false, barPercentage: 0.5, categoryPercentage: 0.6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} visitors` } } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 12 }, color: '#888' }, border: { display: false } }, y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { font: { size: 11 }, color: '#888', maxTicksLimit: 5 }, border: { display: false } } } }
    });
});

/*---- Top Selling Books ----*/
window.addEventListener('load', function () {
    const books = ['The Prophet','Palace Walk','The Cairo Trilogy','Midday Alley','Broken Wings'];
    const units = [520, 480, 610, 390, 310];
    const revenue = [4800, 5600, 8200, 3600, 2800];
    const ctx = document.getElementById('topBooksChart');
    if (!ctx) return;
    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: { labels: books, datasets: [
            { label: 'Units Sold', data: units, backgroundColor: '#C8A96E', borderRadius: 3, borderSkipped: false, barPercentage: 0.5, categoryPercentage: 0.7 },
            { label: 'Revenue ($)', data: revenue, backgroundColor: '#3B5E2F', borderRadius: 3, borderSkipped: false, barPercentage: 0.5, categoryPercentage: 0.7 }
        ]},
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, boxHeight: 12, padding: 12, font: { size: 12 }, color: '#888' } }, tooltip: { mode: 'index', intersect: false } }, scales: { x: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { font: { size: 11 }, color: '#888' }, border: { display: false } }, y: { grid: { display: false }, ticks: { font: { size: 12 }, color: '#888' }, border: { display: false } } } }
    });
});

/*---- Genre Breakdown ----*/
window.addEventListener('load', function () {
    const genres = [
        { label: 'Historical Fiction',  pct: 28, color: '#C0392B' },
        { label: 'Literary Fiction',    pct: 22, color: '#2471A3' },
        { label: 'Poetry / Philosophy', pct: 18, color: '#1E8449' },
        { label: 'Social Realism',      pct: 15, color: '#D4AC0D' },
        { label: 'Romantic Fiction',    pct: 10, color: '#6C3483' },
        { label: 'Post-colonial',       pct: 7,  color: '#784212' },
    ];
    const legend = document.getElementById('genreLegend');
    if (legend) { genres.forEach(g => { legend.innerHTML += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><div style="display:flex;align-items:center;gap:6px;"><div style="width:9px;height:9px;border-radius:50%;background:${g.color};flex-shrink:0;"></div><span style="font-size:12px;color:#888;">${g.label}</span></div><span style="font-size:12px;font-weight:500;">${g.pct}%</span></div>`; }); }
    const ctx = document.getElementById('genreChart');
    if (!ctx) return;
    new Chart(ctx.getContext('2d'), { type: 'doughnut', data: { labels: genres.map(g => g.label), datasets: [{ data: genres.map(g => g.pct), backgroundColor: genres.map(g => g.color), borderWidth: 2, borderColor: '#fff', hoverOffset: 4 }] }, options: { responsive: false, maintainAspectRatio: true, cutout: '60%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` } } } } });
});

/*---- Quick Metrics ----*/
window.addEventListener('load', function () {
    const metrics = [
        { label: 'Avg. Order Value', value: '$52.00', pct: 72, color: '#C8A96E' },
        { label: 'Conversion Rate',  value: '3.8%',   pct: 38, color: '#3B5E2F' },
        { label: 'Repeat Customers', value: '61%',    pct: 61, color: '#2471A3' },
        { label: 'Return Rate',      value: '4.2%',   pct: 42, color: '#C0392B' },
    ];
    const card = document.getElementById('quickMetricsCard');
    if (!card) return;
    let rows = '';
    metrics.forEach((m, i) => { const isLast = i === metrics.length - 1; rows += `<div style="margin-bottom:${isLast?'0':'16px'};"><div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:12px;color:#888;">${m.label}</span><span style="font-size:12px;font-weight:500;">${m.value}</span></div><div style="width:100%;height:4px;background:#f0f0f0;border-radius:2px;"><div style="width:${m.pct}%;height:4px;border-radius:2px;background:${m.color};"></div></div></div>`; });
    card.innerHTML = `<p style="font-size:14px;font-weight:500;margin:0 0 2px;">Quick Metrics</p><p style="font-size:11px;color:#888;margin:0 0 1.25rem;">Key performance indicators</p>${rows}`;
});

/*---- Recent Activity ----*/
window.addEventListener('load', function () {
    const activities = [
        { icon: '🛒', text: 'Order #1064 placed',          time: '2m ago'  },
        { icon: '📦', text: '"The Prophet" restocked',      time: '9m ago'  },
        { icon: '✍️', text: 'New author profile added',     time: '15m ago' },
        { icon: '🛒', text: 'Order #1063 placed',           time: '41m ago' },
        { icon: '⭐', text: '"Cairo Trilogy" got a review', time: '1h ago'  },
        { icon: '📦', text: 'Stock updated for 3 titles',   time: '1h ago'  },
        { icon: '🛒', text: 'Order #1062 placed',           time: '1h ago'  },
    ];
    const card = document.getElementById('recentActivityCard');
    if (!card) return;
    let rows = '';
    activities.forEach((a, i) => { const isLast = i === activities.length - 1; rows += `<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:10px 0;${isLast?'':'border-bottom:0.5px solid #eee;'}"><div style="display:flex;align-items:flex-start;gap:8px;"><div style="width:28px;height:28px;border-radius:50%;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">${a.icon}</div><span style="font-size:12px;color:#333;padding-top:5px;">${a.text}</span></div><span style="font-size:11px;color:#888;white-space:nowrap;padding-top:6px;">${a.time}</span></div>`; });
    card.innerHTML = `<p style="font-size:14px;font-weight:500;margin:0 0 2px;">Recent Activity</p><p style="font-size:11px;color:#888;margin:0 0 0.5rem;">Latest store events</p>${rows}`;
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
    books.forEach((book, i) => { const isLast = i === books.length - 1; const badgeColor = book.danger ? '#C0392B' : '#B7770D'; rows += `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;${isLast?'':'border-bottom:0.5px solid #eee;'}"><div style="display:flex;align-items:center;gap:12px;"><div style="width:28px;height:36px;border-radius:3px;background:${book.color};flex-shrink:0;"></div><div><p style="font-size:13px;font-weight:500;margin:0 0 2px;">${book.title}</p><p style="font-size:11px;color:#888;margin:0;">${book.author}</p></div></div><span style="font-size:11px;font-weight:500;color:${badgeColor};">${book.left} left</span></div>`; });
    card.innerHTML = `<p style="font-size:14px;font-weight:500;margin:0 0 2px;">⚠️ Low Stock</p><p style="font-size:11px;color:#888;margin:0 0 1rem;">Titles needing restock</p>${rows}`;
});
