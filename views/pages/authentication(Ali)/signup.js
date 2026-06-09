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
//  SIGN UP MODULE
// ═══════════════════════════════════════════════════════════════
(() => {

    const API_BASE = window.location.port === '3000' ? '' : 'http://localhost:3000';

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
        const confirmEl  = document.getElementById('confirm-password');
        const termsEl    = document.getElementById('acceptTerms');

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
            if (confirmEl && confirmEl.value) {
                confirmEl.value === passwordEl.value
                    ? showValid(confirmEl)
                    : showError(confirmEl, 'Passwords do not match.');
            }
        });

        confirmEl && confirmEl.addEventListener('blur', () => {
            if (!confirmEl.value) { clearState(confirmEl); return; }
            confirmEl.value === passwordEl.value
                ? showValid(confirmEl)
                : showError(confirmEl, 'Passwords do not match.');
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
            if (confirmEl) {
                if (!confirmEl.value || confirmEl.value !== passwordEl.value) {
                    showError(confirmEl, 'Passwords do not match.'); valid = false;
                }
            }

            if (!valid) return;

            if (termsEl && !termsEl.checked) {
                showToast('Please accept the Terms & Privacy Policy to continue.', 'error');
                return;
            }

            const btn = form.querySelector('.btn-primary');
            btn.textContent = 'Creating account…';
            btn.disabled = true;

            fetch(API_BASE + '/api/auth/signup', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    name:     fullnameEl.value.trim(),
                    email:    emailEl.value.trim().toLowerCase(),
                    password: passwordEl.value
                })
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.error) {
                    var msg = (data.error.toLowerCase().includes('email') || data.error.toLowerCase().includes('registered'))
                        ? data.error : 'Sign up failed — please try again.';
                    showError(emailEl, msg);
                    btn.textContent = 'Sign Up';
                    btn.disabled = false;
                    return;
                }
                try { sessionStorage.setItem('mkFlashToast', 'Account created — please sign in to continue.'); } catch (e) {}
                window.location.href = '/signin';
            })
            .catch(function () {
                showError(emailEl, 'Cannot reach server — make sure the app is running on port 3000.');
                btn.textContent = 'Sign Up';
                btn.disabled = false;
            });
        });
    }

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
        initSignup();
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
