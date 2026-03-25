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
const ripple = document.getElementById('bgRipple');

if (ripple) {
    const genreCards = document.querySelectorAll('.genre-card[data-color]');
    const genresContainer = document.querySelector('.genres-container');
    const navbar = document.querySelector('.navbarb');
    let currentCard = null;

    genreCards.forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            const rect = card.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            ripple.classList.remove('active');
            void ripple.offsetWidth;

            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.backgroundColor = card.dataset.color;

            ripple.classList.add('active');

            // Turn text white
            if (genresContainer) genresContainer.classList.add('text-white');
            if (navbar) navbar.classList.add('text-white');

            currentCard = card;
        });

        card.addEventListener('mouseleave', () => {
            const rect = card.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            // Remove the colored ripple
            ripple.classList.remove('active');

            // Revert text color
            if (genresContainer) genresContainer.classList.remove('text-white');
            if (navbar) navbar.classList.remove('text-white');

            // Create a second ripple that spreads the original bg color
            const reverseRipple = document.createElement('div');
            reverseRipple.classList.add('bg-ripple', 'bg-ripple-reverse');
            reverseRipple.style.left = x + 'px';
            reverseRipple.style.top = y + 'px';
            reverseRipple.style.backgroundColor = getComputedStyle(document.body).backgroundColor;
            document.body.appendChild(reverseRipple);

            // Trigger the animation
            void reverseRipple.offsetWidth;
            reverseRipple.classList.add('active');

            // Remove after animation completes
            reverseRipple.addEventListener('transitionend', () => {
                reverseRipple.remove();
            });

            currentCard = null;
        });
    });
}

    const Books=[
        {
            title: "Ugly Love",
            author: "Colleen Hoover",
            genre: "Drama",
            year: "2014",
            image: "../resources/Books/UglyLove.png",
            pages: "336"
        },
        {
            title: "Journey to the center of the earth",
            author: "Jules Verne",
            genre: "Adventure",
            year: "1864",
            image: "../resources/Books/JourneyToThe CentreOfTheEarth.png",
            pages: "240"
        },
        {
            title: "A Song Of Ice And Fire",
            author: "George R.R. Martin",
            genre: "Fantasy",
            year: "1996",
            image: "../resources/Books/ASongOfIceAndFire.png",
            pages: "720"

        },
        {
            title: "Verity",
            author: "Colleen Hoover",
            genre: "Thriller",
            year: "2018",
            image: "../resources/Books/Verity.png",
            pages: "336"
            
        },
        {
            title: "Chapterhouse: Dune",
            author: "Frank Herbert",
            genre: "Science-Fiction",
            year: "1985",
            image: "../resources/Books/Dune.png",
            pages: "622"
        },
        {
            title: "The Shining",
            author: "Stephen King",
            genre: "Horror",
            year: "1977",
            image: "../resources/Books/TheShining.png",
            pages: "468"
        }

    ];
const container = document.getElementById("books-container");

Books.forEach(book => {
  const card = document.createElement("div");
  card.classList.add("book-listing");

  card.innerHTML = `
    <img class= "book-cover" src="${book.image}" >
    <button class="add-to-cart" type="submit">Add to cart</button>
    <p class= "book-details">${book.genre} | ${book.year}</p>
    <h3 class= "book-title">${book.title}</h3>
    <p class="book-author">${book.author}</p>
    
  `;

  container.appendChild(card);
});



/*-----sign-in-----*/
 

function login(){

let email =document.getElementById("email").value;
let password =document.getElementById("password").value;
let pattern =/^(?=.*[A-Z])(?=.*\d).+$/;
message.innerText = "";
    message.className = "form-message";

if(email=="" || password==""){
message.innerText = "Some fields are not filled!";
message.classList.add("error");
return false;
}
else if(!email.includes(".") || !email.includes("@"))
{
message.innerText = "invalid email";
        message.classList.add("error");
        return false;

}
else if(password.length<6)
{
    message.innertext="password must me atleast 6 characters!"
message.classList.add("error");
return false;
}
else if(!pattern.test(password))
{
    message.innerText = "Password must contain a capital letter and a number";
           message.classList.add("error");
           return false;
}

message.innerText = "Login successful ";
    message.classList.add("success");

    return true;


}