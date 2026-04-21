const menuBtn = document.getElementById('menuBtn');
const menuDropdown = document.getElementById('menuDropdown');
const menuWrapper = document.querySelector('.menu-dropdown-wrapper');

if (menuBtn && menuDropdown && menuWrapper) {
    // Break dropdown out of navbar to avoid overflow:hidden clipping
    document.body.appendChild(menuDropdown);

    const positionDropdown = () => {
        const btnRect = menuBtn.getBoundingClientRect();
        // Position fixed just below the button and aligned to its right edge
        menuDropdown.style.top = (btnRect.bottom + 15) + 'px';
        menuDropdown.style.left = (btnRect.right - menuDropdown.offsetWidth) + 'px';
    };

    window.addEventListener('resize', positionDropdown);
    window.addEventListener('scroll', positionDropdown);

    let hoverTimeout;

    // Hover logic
    menuWrapper.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        positionDropdown();
        menuDropdown.classList.add('open');
    });

    menuWrapper.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(() => {
            menuDropdown.classList.remove('open');
        }, 150); // slight delay for smooth hover
    });

    menuDropdown.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
    });

    menuDropdown.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(() => {
            menuDropdown.classList.remove('open');
        }, 150);
    });

    // Click logic
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        positionDropdown();
        menuDropdown.classList.toggle('open');
    });

    menuWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    menuDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.addEventListener('click', () => {
        menuDropdown.classList.remove('open');
    });
}
//Filters box
const btn = document.getElementById('toggleBtn');
const box = document.getElementById('expandBox');

if (btn && box) {
    btn.addEventListener('click', () => {
        box.classList.toggle('open');
        console.log("Filter menu toggled!");
    });
}
// Search button
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.querySelector('.search-input');

if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
    });
}
const BookSearchBtn = document.getElementById('BookSearchBtn');



// Genre tab background


/*PRODUCT PAGE*/

/* Make navbar items white over dark backgrounds globally */
function handleNavbarColorInversion() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Add any dark sections you want the navbar to invert over here
    const darkSections = document.querySelectorAll('.site-footer, .book-bg');
    const navRect = navbar.getBoundingClientRect();

    let isDark = false;

    darkSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        // Check if navbar vertically overlaps the dark section
        if (rect.top < navRect.bottom - 10 && rect.bottom > navRect.top + 10) {
            isDark = true;
        }
    });

    // We shouldn't interfere if the user is hovering a specific genre card that relies on it manually
    const ripple = document.getElementById('bgRipple');
    const isRippleActive = ripple && ripple.classList.contains('active');

    if (isDark) {
        navbar.classList.add('text-white');
    } else if (!isRippleActive) {
        navbar.classList.remove('text-white');
    }
}



/*-----sign-in-----*/



// AUTHOR PAGE


window.addEventListener('scroll', function () {
    const scrollPos = window.scrollY;
    const heroContent = document.querySelector('.authorPhoto-content');
    const heroBg = document.querySelector('.authorPhoto-bg');

    // 1. Fade out the text ("Amr Diab") as you scroll
    if (heroContent) {
        let opacity = 1 - (scrollPos / 300);
        heroContent.style.opacity = opacity >= 0 ? opacity : 0;
    }

    // 2. Subtle Zoom/Parallax effect on the photo
    if (heroBg) {
        heroBg.style.transform = 'scale(' + (1 + scrollPos / 2000) + ')';
    }
});





window.addEventListener('load', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const authorId = urlParams.get('id');

    if (authorId && authorData[authorId]) {
        const data = authorData[authorId];

        // 1. Update Banner & About Sections
        document.getElementById('author-name-heading').textContent = data.name;
        document.getElementById('author-stats-sub').textContent = data.stats;
        document.getElementById('about-title').textContent = data.aboutTitle;
        document.getElementById('about-description').textContent = data.aboutText;

        const banner = document.getElementById('dynamic-banner');
        if (banner) {
            banner.style.backgroundImage = `linear-gradient(to top, rgba(0,0,0,0.8), transparent), url('${data.bannerImg}')`;
        }

        const aboutImg = document.getElementById('about-img');
        if (aboutImg) aboutImg.src = data.profileImg;

        // 2. Update Books Row with your EXACT CSS Structure
        const bookRow = document.getElementById('books-container');
        if (bookRow) {
            bookRow.innerHTML = ''; // Clears static placeholders

            data.books.forEach(book => {
                // We use backticks (`) to create the exact HTML structure from your CSS
                const bookHTML = `
            <div class="book-container">
                <img src="${book.cover}" class="book-img" alt="${book.title}">
                
                <div class="book-infosss">
                    <div class="book-name">${book.title}</div>
                    
                    <div class="rating-row">
                        <span class="star-icon">★</span>
                        <span class="rating-num">${book.rating}</span>
                        <span class="review-count">· ${book.reviews} reviews</span>
                    </div>
                </div>
            </div>
        `;
                bookRow.insertAdjacentHTML('beforeend', bookHTML);
            });
        }
    }
});





// HOME PAGE 


/*  THE BUTTON JS  */
const track = document.getElementById('track');
const slideLeft = document.getElementById('slideLeft');
const slideRight = document.getElementById('slideRight');

const scrollAmount = 300; // Adjust to match your card width + gap

function updateButtons() {
    if (!track || !slideLeft || !slideRight) return;

    // Check if we are at the very start (Left)
    if (track.scrollLeft <= 0) {
        slideLeft.classList.add('disabled');
    } else {
        slideLeft.classList.remove('disabled');
    }

    // Check if we are at the very end (Right)
    // scrollWidth is the total length, clientWidth is what you see
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 1) {
        slideRight.classList.add('disabled');
    } else {
        slideRight.classList.remove('disabled');
    }
}

if (track && slideLeft && slideRight) {
    slideLeft.addEventListener('click', () => {
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    slideRight.addEventListener('click', () => {
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    // Listen for the scroll to finish to update buttons
    track.addEventListener('scroll', updateButtons);

    // Run once on page load to set initial state
    updateButtons();
}




document.addEventListener("DOMContentLoaded", function () {
    const observerOptions = {
        threshold: 0.15 // Trigger when 15% of the element is visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                // Optional: stop observing once it has appeared
                // observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    // Select all elements with the 'reveal' class and start watching them
    const hiddenElements = document.querySelectorAll(".reveal");
    hiddenElements.forEach((el) => observer.observe(el));
});










/* THE FOOTER LINKS */


const footerLinks = document.querySelectorAll('.footer-link');

footerLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();


        const targetId = this.getAttribute('data-target');
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
            // Get the position and scroll smoothly
            const offset = 80; // Space for your header/top padding
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = targetSection.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

(() => {

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
                setTimeout(() => {
                    btn.textContent = 'Sign Up';
                    btn.disabled = false;
                }, 2000);
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

        form.addEventListener('submit', e => {
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
                btn.textContent = 'Signing in…';
                btn.disabled = true;
                setTimeout(() => {
                    btn.textContent = 'Sign In';
                    btn.disabled = false;
                }, 2000);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        setupTogglePassword();
        initSignup();
        initSignin();
    });

})();