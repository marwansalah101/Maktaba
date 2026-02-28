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

// Genre cards: GIF play-once-then-freeze + page background change
const GENRE_CONFIG = {
    'genre-card-romance': {
        gif:      'https://media.giphy.com/media/l0MYGb1LuZ3n7dRnO/giphy.gif',
        duration: 3000,
        pageBg:   'linear-gradient(135deg, #fff0f3 0%, #f7c3d0 100%)'
    },
    'genre-card-fantasy': {
        gif:      '../resources/img/DragonGif.gif',
        duration: 4000,
        pageBg:   'linear-gradient(135deg, #1a0533 0%, #3b1f6b 100%)'
    },
    'genre-card-thriller': {
        gif:      'https://i.pinimg.com/originals/3c/2b/b0/3c2bb0ec65abb64f7c77d6793b5c8c2a.gif',
        duration: 3000,
        pageBg:   'linear-gradient(135deg, #1a0a0a 0%, #3d0000 100%)'
    },
    'genre-card-scifi': {
        gif:      'https://media.giphy.com/media/3oKIPEqDGUULpEU0aQ/giphy.gif',
        duration: 3500,
        pageBg:   'linear-gradient(135deg, #000814 0%, #001d3d 100%)'
    },
    'genre-card-biography': {
        gif:      'https://media.giphy.com/media/3o7btNa0RUYa5E7iiQ/giphy.gif',
        duration: 3000,
        pageBg:   'linear-gradient(135deg, #f5e6d3 0%, #c49a6c 100%)'
    },
    'genre-card-religion': {
        gif:      'https://media.giphy.com/media/26uf9QPzzlKPGYZnW/giphy.gif',
        duration: 3000,
        pageBg:   'linear-gradient(135deg, #fdf3e3 0%, #d4a017 100%)'
    }
};