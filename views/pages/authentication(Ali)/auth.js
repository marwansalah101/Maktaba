(() => {
    /* Admin credentials have been moved to .env on the server.
       Sign-in now calls POST /api/auth/login instead of checking a
       hardcoded object — credentials are never shipped to the browser. */


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

    function getPasswordStrength(pw) {
        let score = 0;
        if (pw.length >= 8) score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
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












    

    function initSignup() {
        const form = document.getElementById('signupForm');
        if (!form) return;

        const fullnameEl = document.getElementById('fullname');
        const emailEl = document.getElementById('email');
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

            if (valid) {
                const btn = form.querySelector('.btn-primary');
                btn.textContent = 'Creating account…';
                btn.disabled = true;

                const users = JSON.parse(localStorage.getItem('maktabaUsers') || '[]');
                const exists = users.some(u => u.email.toLowerCase() === emailEl.value.trim().toLowerCase());
                if (!exists) {
                    users.push({ fullname: fullnameEl.value.trim(), email: emailEl.value.trim() });
                    try { localStorage.setItem('maktabaUsers', JSON.stringify(users)); } catch(e) {}
                }

                setTimeout(() => {
                    btn.textContent = 'Sign Up';
                    btn.disabled = false;
                    window.location.href = './signin.html';
                }, 1500);
            }
        });
    }

    function initSignin() {
        const form = document.getElementById('signinForm');
        if (!form) return;

        const emailEl = document.getElementById('email');
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

        form.addEventListener('submit', async e => {
            e.preventDefault();
            let valid = true;

            if (!emailEl.value.trim() || !rules.email.validate(emailEl.value)) {
                showError(emailEl, rules.email.message); valid = false;
            }
            if (!rules.password_signin.validate(passwordEl.value)) {
                showError(passwordEl, rules.password_signin.message); valid = false;
            }

            if (valid) {
                const btn = form.querySelector('.btn-primary');
                btn.textContent = 'Signing in...';
                btn.disabled = true;
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: emailEl.value.trim(),
                            password: passwordEl.value
                        })
                    });
                    const data = await response.json();
                    if (!response.ok) {
                        showError(passwordEl, data.error || 'Incorrect email or password.');
                        btn.textContent = 'Sign In';
                        btn.disabled = false;
                        return;
                    }
                    localStorage.setItem('maktabaUserRole',  data.role);
                    localStorage.setItem('maktabaUserEmail', data.email);
                    window.location.href = './dashboard.html';
                } catch (_) {
                    showError(passwordEl, 'Connection error — make sure the server is running.');
                    btn.textContent = 'Sign In';
                    btn.disabled = false;
                }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        setupTogglePassword();
        initSignup();
        initSignin();
    });

})();


/* ---- Forgot Password ---- */
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
    const errEl = document.getElementById('fp-error');
    const email = emailEl ? emailEl.value.trim() : '';

    errEl.textContent = '';
    errEl.classList.remove('show');
    emailEl.classList.remove('error', 'valid');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailEl.classList.add('error');
        errEl.textContent = 'Please enter a valid e-mail address.';
        errEl.classList.add('show');
        return;
    }

    /* Always show the success message — never reveal whether an account exists.
       (Actual email delivery is not yet implemented.) */
    document.getElementById('fp-form-wrap').style.display = 'none';
    document.getElementById('fp-sent-email').textContent = email;
    document.getElementById('fp-success').style.display = 'block';
}

/*--------------dashboard----------*/

function goToAuthors() {
  window.location.href = "./totalauth.html";
}

function goToBooks(){

    window.location.href ="./authbooks.html"
}


function toggleMenu() {
  document.getElementById("sidebar").classList.toggle("active");

}


/*---graph---*/

window.addEventListener('load', function () {
  const labels = ['Jul 24','Aug','Sep','Oct','Nov','Dec 24','Jan','Feb','Mar','Apr','May','Jun 25'];
  const revenue = [1800,2200,3500,5200,3800,4100,3200,3600,4400,5000,5800,6200];
  const sold = [40,55,90,130,95,105,80,90,110,125,145,155];

  const ctx = document.getElementById('revenueChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Book Revenue',
          data: revenue,
          borderColor: '#C8A96E',
          backgroundColor: 'rgba(200,169,110,0.15)',
          borderWidth: 2, fill: true, tension: 0.45, pointRadius: 0
        },
        {
          label: 'Orders',
          data: sold.map(v => v * 35),
          borderColor: '#3B5E2F',
          backgroundColor: 'rgba(59,94,47,0.12)',
          borderWidth: 2, fill: true, tension: 0.45, pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        x: { grid: { display: false } },
        y: { ticks: { callback: v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v } }
      }
    }
  });
});

/*---gener breakdown--*/

/* Book Modal Functions */
function openAddBookModal() {
    const modal = document.getElementById('addBookModal');
    if (modal) {
        modal.classList.add('show');
        const form = document.getElementById('addBookForm');
        if (form) form.reset();
    }
}

function closeAddBookModal() {
    const modal = document.getElementById('addBookModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('addBookModal');
        if (modal && event.target === modal) {
            closeAddBookModal();
        }
    });
});

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
  if (legend) {
    genres.forEach(g => {
      legend.innerHTML += `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <div style="width:9px; height:9px; border-radius:50%; background:${g.color}; flex-shrink:0;"></div>
            <span style="font-size:12px; color:#888;">${g.label}</span>
          </div>
          <span style="font-size:12px; font-weight:500;">${g.pct}%</span>
        </div>`;
    });
  }

  const genreCtx = document.getElementById('genreChart').getContext('2d');
  new Chart(genreCtx, {
    type: 'doughnut',
    data: {
      labels: genres.map(g => g.label),
      datasets: [{
        data: genres.map(g => g.pct),
        backgroundColor: genres.map(g => g.color),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 4
      }]
    },
    options: {
      responsive: false,       
      maintainAspectRatio: true,
      cutout: '60%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed}%`
          }
        }
      }
    }
  });

});


/*----weekly visitors----*/

window.addEventListener('load', function () {

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const visits = [320, 410, 350, 510, 600, 890, 430];

  const peak = visits.indexOf(Math.max(...visits));
  document.getElementById('peakDay').textContent = `${days[peak]}: ${visits[peak]}`;

  const ctx = document.getElementById('visitorsChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        label: 'Visitors',
        data: visits,
        backgroundColor: visits.map((v, i) => i === peak ? '#1B2E4B' : '#2C4A72'),
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 0.5,
        categoryPercentage: 0.6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} visitors` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 12 }, color: '#888' }, border: { display: false } },
        y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { font: { size: 11 }, color: '#888', maxTicksLimit: 5 }, border: { display: false } }
      }
    }
  });

});



/*-----top selling----*/

window.addEventListener('load', function () {

  const books = ['The Prophet','Palace Walk','The Cairo Trilogy','Midday Alley','Broken Wings'];
  const units = [520, 480, 610, 390, 310];
  const revenue = [4800, 5600, 8200, 3600, 2800];

  const ctx = document.getElementById('topBooksChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: books,
      datasets: [
        {
          label: 'Units Sold',
          data: units,
          backgroundColor: '#C8A96E',
          borderRadius: 3,
          borderSkipped: false,
          barPercentage: 0.5,
          categoryPercentage: 0.7
        },
        {
          label: 'Revenue ($)',
          data: revenue,
          backgroundColor: '#3B5E2F',
          borderRadius: 3,
          borderSkipped: false,
          barPercentage: 0.5,
          categoryPercentage: 0.7
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, boxHeight: 12, padding: 12, font: { size: 12 }, color: '#888' }
        },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { font: { size: 11 }, color: '#888' }, border: { display: false } },
        y: { grid: { display: false }, ticks: { font: { size: 12 }, color: '#888' }, border: { display: false } }
      }
    }
  });

});



/*----matrics ---*/


window.addEventListener('load', function () {

  const metrics = [
    { label: 'Avg. Order Value',   value: '$52.00', pct: 72, color: '#C8A96E' },
    { label: 'Conversion Rate',    value: '3.8%',   pct: 38, color: '#3B5E2F' },
    { label: 'Repeat Customers',   value: '61%',    pct: 61, color: '#2471A3' },
    { label: 'Return Rate',        value: '4.2%',   pct: 42, color: '#C0392B' },
  ];

  const card = document.getElementById('quickMetricsCard');

  let rows = '';
  metrics.forEach((m, i) => {
    const isLast = i === metrics.length - 1;
    rows += `
      <div style="margin-bottom:${isLast ? '0' : '16px'};">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="font-size:12px; color:#888;">${m.label}</span>
          <span style="font-size:12px; font-weight:500;">${m.value}</span>
        </div>
        <div style="width:100%; height:4px; background:#f0f0f0; border-radius:2px;">
          <div style="width:${m.pct}%; height:4px; border-radius:2px; background:${m.color};"></div>
        </div>
      </div>`;
  });

  card.innerHTML = `
    <p style="font-size:14px; font-weight:500; margin:0 0 2px;">Quick Metrics</p>
    <p style="font-size:11px; color:#888; margin:0 0 1.25rem;">Key performance indicators</p>
    ${rows}
  `;

});


/*----recent activity----*/

window.addEventListener('load', function () {

  const activities = [
    { icon: 'ðŸ›’', text: 'Order #1064 placed',           time: '2m ago'  },
    { icon: 'ðŸ“¦', text: '"The Prophet" restocked',       time: '9m ago'  },
    { icon: 'âœï¸', text: 'New author profile added',      time: '15m ago' },
    { icon: 'ðŸ›’', text: 'Order #1063 placed',            time: '41m ago' },
    { icon: 'â­', text: '"Cairo Trilogy" got a review',  time: '1h ago'  },
    { icon: 'ðŸ“¦', text: 'Stock updated for 3 titles',    time: '1h ago'  },
    { icon: 'ðŸ›’', text: 'Order #1062 placed',            time: '1h ago'  },
  ];

  const card = document.getElementById('recentActivityCard');

  let rows = '';
  activities.forEach((a, i) => {
    const isLast = i === activities.length - 1;
    rows += `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px; padding:10px 0; ${isLast ? '' : 'border-bottom:0.5px solid #eee;'}">
        <div style="display:flex; align-items:flex-start; gap:8px;">
          <div style="width:28px; height:28px; border-radius:50%; background:#f5f5f5; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0;">${a.icon}</div>
          <span style="font-size:12px; color:#333; padding-top:5px;">${a.text}</span>
        </div>
        <span style="font-size:11px; color:#888; white-space:nowrap; padding-top:6px;">${a.time}</span>
      </div>`;
  });

  card.innerHTML = `
    <p style="font-size:14px; font-weight:500; margin:0 0 2px;">Recent Activity</p>
    <p style="font-size:11px; color:#888; margin:0 0 0.5rem;">Latest store events</p>
    ${rows}
  `;

});

/*----low stock-----*/

window.addEventListener('load', function () {

  const books = [
    { title: 'Season of Migrat...', author: 'Salih',  color: '#2C3E50', left: 7,  danger: true  },
    { title: 'The Cairo Trilogy',  author: 'Mahfouz', color: '#922B21', left: 10, danger: false },
    { title: 'Broken Wings',       author: 'Gibran',  color: '#4A4A4A', left: 18, danger: false },
    { title: 'Palace Walk',        author: 'Mahfouz', color: '#B7950B', left: 24, danger: false },
    { title: 'Midaq Alley',        author: 'Mahfouz', color: '#6C3483', left: 31, danger: false },
  ];

  const card = document.getElementById('lowStockCard');

  let rows = '';
  books.forEach((book, i) => {
    const isLast = i === books.length - 1;
    const badgeColor = book.danger ? '#C0392B' : '#B7770D';
    rows += `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 0; ${isLast ? '' : 'border-bottom:0.5px solid #eee;'}">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:28px; height:36px; border-radius:3px; background:${book.color}; flex-shrink:0;"></div>
          <div>
            <p style="font-size:13px; font-weight:500; margin:0 0 2px;">${book.title}</p>
            <p style="font-size:11px; color:#888; margin:0;">${book.author}</p>
          </div>
        </div>
        <span style="font-size:11px; font-weight:500; color:${badgeColor};">${book.left} left</span>
      </div>`;
  });

  card.innerHTML = `
    <p style="font-size:14px; font-weight:500; margin:0 0 2px;">âš ï¸ Low Stock</p>
    <p style="font-size:11px; color:#888; margin:0 0 1rem;">Titles needing restock</p>
    ${rows}
  `;

});

