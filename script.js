// 1. Grab the elements
const btn = document.getElementById('toggleBtn');
const box = document.getElementById('expandBox');

// 2. Only run if BOTH exist on the current page
if (btn && box) {
    btn.addEventListener('click', () => {
        box.classList.toggle('open');
        console.log("Filter menu toggled!");
    });
}