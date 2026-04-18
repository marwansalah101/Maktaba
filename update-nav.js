const fs = require('fs');
const path = require('path');
const targetDir = 'c:/Users/pc/Documents/GitHub/Mactaba/Tabs';
const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.html'));

const newNav = `<nav class="navbar ">
        <div id="Maktaba">
            <a href="#Maktaba">
                <h1>Maktaba</h1>
            </a>
        </div>
        <ul class="navrbar-text">
            <li>
                <a href="Home.html">
                    Home
                </a>
            </li>
            <li>
                <a href="Genres.html">
                    Browse
                </a>
            </li>
            <li>
                <a href="Collection.html">
                    Collection
                </a>
            </li>
            <li>
                <a href="Favorites.html">
                    Favourites
                </a>
            </li>
        </ul>
        <div class="navbar-icons">
            <a href="AddtoCart.html">
                <span class="material-symbols-outlined">shopping_bag</span>     
            </a>
            <div class="menu-dropdown-wrapper" id="menuWrapper">
                <span class="material-symbols-outlined" id="menuBtn">menu</span>
            </div>
            <div class="menu-dropdown" id="menuDropdown">
                <a href="signup.html">Profile</a>
                <a href="settings.html">Settings</a>
                <a href="ContactUs.html" class="contact-placeholder">Contact Us</a>
            </div>
        </div>
    </nav>`;

let updatedCount = 0;
for (const file of files) {
  const filePath = path.join(targetDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  const navStart = content.indexOf('<nav');
  const navEndMatch = content.indexOf('</nav>');
  
  if (navStart !== -1 && navEndMatch !== -1) {
    const navEnd = navEndMatch + 6;
    
    // Some old versions had an extra </div> before </nav>, extract it properly:
    // Actually just replace from navStart to navEnd.
    let prefix = content.slice(0, navStart);
    let suffix = content.slice(navEnd);
    
    // We already noticed Genres.html had an extra </div> *inside* the navbar right before </nav>.
    // That means it's captured inside the slice we are throwing away, which is good! The extra </div> is gone.
    // However, if the old extraneous </div> wasn't inside <nav> but outside, we might have issues.
    // Looking at the console.log from earlier, it was inside <nav>, so replacing <nav>...</nav> cleans it up!

    content = prefix + newNav + suffix;
    
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
  }
}
console.log('Updated nav in ' + updatedCount + ' files.');
