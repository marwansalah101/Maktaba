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

    window.location.href = '/home';
}

function googleSignIn() {
    if (typeof google === 'undefined') {
        alert('Google Sign-In is not loaded yet. Please wait a moment and try again.');
        return;
    }
    google.accounts.id.prompt();
}

// ═══════════════════════════════════════════════════════════════
//  SIGN IN MODULE
// ═══════════════════════════════════════════════════════════════
(() => {

    const API_BASE = window.location.port === '3000' ? '' : 'http://localhost:3000';

    // ─── Validation Rules ───────────────────────────────────────────
    const rules = {
        email: {
            validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
            message: 'Please enter a valid e-mail address.'
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

    // ─── Toast ──────────────────────────────────────────────────────
    function showToast(message, type, duration) {
        type     = type     || 'success';
        duration = duration || 3500;
        var existing = document.getElementById('mkt-toast');
        if (existing) existing.remove();
        var t = document.createElement('div');
        t.id = 'mkt-toast';
        t.className = 'mkt-toast mkt-toast--' + type;
        t.textContent = message;
        document.body.appendChild(t);
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { t.classList.add('mkt-toast--show'); });
        });
        setTimeout(function () {
            t.classList.remove('mkt-toast--show');
            setTimeout(function () { if (t.parentNode) t.remove(); }, 420);
        }, duration);
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

            fetch(API_BASE + '/api/auth/login', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    email:    emailEl.value.trim().toLowerCase(),
                    password: passwordEl.value
                })
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.error) {
                    showError(passwordEl, data.error);
                    btn.textContent = 'Sign In';
                    btn.disabled = false;
                    return;
                }
                if (data.token) localStorage.setItem('maktabaToken', data.token);
                var role = data.role || 'user';
                if (data.user) {
                    localStorage.setItem('maktabaUserName',     data.user.name);
                    localStorage.setItem('maktabaUserEmail',    data.user.email);
                    localStorage.setItem('maktabaUserRole',     role);
                    localStorage.setItem('maktabaLoggedInUser', JSON.stringify(data.user));
                } else {
                    localStorage.setItem('maktabaUserEmail', data.email || '');
                    localStorage.setItem('maktabaUserRole',  role);
                }
                btn.textContent = 'Sign In';
                btn.disabled = false;

                var who = (data.user && data.user.name) ? data.user.name : 'reader';
                try { sessionStorage.setItem('mkFlashToast', 'Welcome back, ' + who + '!'); } catch (e) {}

                var go = function () {
                    if (role === 'admin') window.location.href = '/dashboard';
                    else window.location.href = '/home';
                };
                if (typeof window.mkSyncOnLogin === 'function') {
                    window.mkSyncOnLogin().then(go, go);
                } else {
                    go();
                }
            })
            .catch(function () {
                showError(passwordEl, 'Cannot reach server — make sure the app is running on port 3000.');
                btn.textContent = 'Sign In';
                btn.disabled = false;
            });
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
    document.addEventListener('DOMContentLoaded', function () {
        var pending = sessionStorage.getItem('mktbToast');
        if (pending) {
            try {
                var p = JSON.parse(pending);
                sessionStorage.removeItem('mktbToast');
                setTimeout(function () { showToast(p.msg, p.type); }, 300);
            } catch (e) {}
        }
        setupTogglePassword();
        initSignin();
        initGoogleSignIn();
    });

})();

// ─── Dark Mode ───────────────────────────────────────────────────
function toggleDarkMode() {
    const card = document.querySelector('.auth-shell') || document.querySelector('.signup-card') || document.querySelector('.signin-card');
    const icon = document.getElementById('dark-icon');
    if (!card) return;
    card.classList.toggle('dark');
    document.body.classList.toggle('dark', card.classList.contains('dark'));

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

/* ══════════════════════════════════════════════════════════════════
   FORGOT PASSWORD — multi-step modal
══════════════════════════════════════════════════════════════════ */
const API_BASE = window.location.port === '3000' ? '' : 'http://localhost:3000';
let fpEmail = '';

function openForgotPw() {
  document.getElementById('fp-modal-overlay').classList.add('open');
  showStep(1);
}

function closeForgotPw() {
  document.getElementById('fp-modal-overlay').classList.remove('open');
  showStep(1);
  document.getElementById('fp-email').value = '';
  document.getElementById('fp-otp').value = '';
  document.getElementById('fp-new-password').value = '';
}

function showStep(n) {
  [1, 2, 3, 4].forEach(i => {
    document.getElementById('fp-step-' + i).style.display = i === n ? '' : 'none';
  });
}

function setFpError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('show');
}

function clearFpError(id) {
  const el = document.getElementById(id);
  el.textContent = '';
  el.classList.remove('show');
}

async function submitForgotEmail() {
  clearFpError('fp-error-1');
  const email = document.getElementById('fp-email').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return setFpError('fp-error-1', 'Please enter a valid email address.');
  }
  const btn = event.target;
  btn.textContent = 'Sending...';
  btn.disabled = true;
  try {
    const res  = await fetch(API_BASE + '/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) return setFpError('fp-error-1', data.error || 'Something went wrong.');
    fpEmail = email;
    document.getElementById('fp-sent-email').textContent = email;
    showStep(2);
  } catch {
    setFpError('fp-error-1', 'Cannot reach server.');
  } finally {
    btn.textContent = 'Send Code';
    btn.disabled = false;
  }
}

async function submitOtp() {
  clearFpError('fp-error-2');
  const otp = document.getElementById('fp-otp').value.trim();
  if (otp.length !== 6) return setFpError('fp-error-2', 'Please enter the 6-digit code.');
  const btn = event.target;
  btn.textContent = 'Verifying...';
  btn.disabled = true;
  try {
    const res  = await fetch(API_BASE + '/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fpEmail, otp })
    });
    const data = await res.json();
    if (!res.ok) return setFpError('fp-error-2', data.error || 'Incorrect code.');
    showStep(3);
  } catch {
    setFpError('fp-error-2', 'Cannot reach server.');
  } finally {
    btn.textContent = 'Verify Code';
    btn.disabled = false;
  }
}

async function submitNewPassword() {
  clearFpError('fp-error-3');
  const newPassword = document.getElementById('fp-new-password').value;
  if (newPassword.length < 8) return setFpError('fp-error-3', 'Password must be at least 8 characters.');
  const otp = document.getElementById('fp-otp').value.trim();
  const btn = event.target;
  btn.textContent = 'Updating...';
  btn.disabled = true;
  try {
    const res  = await fetch(API_BASE + '/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fpEmail, otp, newPassword })
    });
    const data = await res.json();
    if (!res.ok) return setFpError('fp-error-3', data.error || 'Something went wrong.');
    showStep(4);
  } catch {
    setFpError('fp-error-3', 'Cannot reach server.');
  } finally {
    btn.textContent = 'Reset Password';
    btn.disabled = false;
  }
}
