const Books = [
    {
        title: "Ugly Love",
        author: "Colleen Hoover",
        genre: "Drama",
        year: 2014,
        image: "resources/Books/UglyLove.png",
        pages: 336,
        description: "A heart-wrenching love story that explores the complexities of relationships and the power of love to heal even the deepest wounds.",
        quote: "Love is not always pretty, but it's worth fighting for.",
        price: 320,
        language: "English",
        stock: 10,
        ISBN: "978-1501115185"
    },
    {
        title: "Journey to the center of the earth",
        author: "Jules Verne",
        genre: "Adventure",
        year: 1864,
        image: "resources/Books/JourneyToThe CentreOfTheEarth.png",
        pages: 240,
        description: "A thrilling adventure novel that takes readers on a journey to the center of the Earth, filled with danger, discovery, and excitement.",
        quote: "The most dangerous place on Earth is the center of it.",
        price: 480,
        language: "English",
        stock: 5,
        ISBN: "978-1503215153"
    },
    {
        title: "A Song Of Ice And Fire",
        author: "George R.R. Martin",
        genre: "Fantasy",
        year: 1996,
        image: "resources/Books/ASongOfIceAndFire.png",
        pages: 720,
        description: "An epic fantasy series that weaves together political intrigue, complex characters, and a richly detailed world filled with magic and danger.",
        quote: "A song of ice and fire, a tale of two houses, a story of love and loss.",
        price: 650,
        language: "English",
        stock: 15,
        ISBN: "978-0553103540"
    },
    {
        title: "Verity",
        author: "Colleen Hoover",
        genre: "Thriller",
        year: 2018,
        image: "resources/Books/Verity.png",
        pages: 336,
        description: "A gripping psychological thriller that delves into the dark secrets of a bestselling author, blurring the lines between fiction and reality in a chilling tale of obsession and deception.",
        quote: "The truth is often more complicated than the lies we tell ourselves.",
        price: 420,
        language: "English",
        stock: 8,
        ISBN: "978-1538739723"
    },
    {
        title: "Chapterhouse: Dune",
        author: "Frank Herbert",
        genre: "Science Fiction",
        year: 1985,
        image: "resources/Books/Dune.png",
        pages: 622,
        description: "The sixth novel in the Dune series, Chapterhouse: Dune continues the epic saga of political intrigue, religious conflict, and ecological struggle on the desert planet of Arrakis.",
        quote: "The most dangerous place on Earth is the center of it.",
        price: 580,
        language: "English",
        stock: 5,
        ISBN: "978-0441175988"
    },
    {
        title: "The Shining",
        author: "Stephen King",
        genre: "Horror",
        year: 1977,
        image: "resources/Books/TheShining.png",
        pages: 468,
        description: "A chilling horror novel that follows the story of a family staying in an isolated hotel during the winter, where supernatural forces and psychological terror threaten to drive them to madness.",
        quote: "We all go a little mad sometimes.",
        price: 380,
        language: "English",
        stock: 20,
        ISBN: "978-0307743657"
    },
    {
        title: "Six of Crows",
        author: "Leigh Bardugo",
        genre: "Fantasy",
        year: 2015,
        image: "resources/Books/SixOfCrows.png",
        pages: 465,
        description: "A thrilling fantasy heist novel set in the bustling city of Ketterdam. Criminal prodigy Kaz Brekker assembles a crew of six dangerous outcasts to attempt an impossible heist that could make them rich beyond measure.",
        quote: "No mourners. No funerals.",
        price: 480,
        language: "English",
        stock: 12,
        ISBN: "978-1627792127"
    },
    {
        title: "A Court of Thorns and Roses",
        author: "Sarah J. Maas",
        genre: "Fantasy",
        year: 2015,
        image: "resources/Books/CourtOfThornsAndRoses.png",
        pages: 432,
        description: "When nineteen-year-old Feyre kills a wolf in the woods, a terrifying creature arrives to demand retribution. Taken to a magical land ruled by faeries, Feyre discovers that her captor Tamlin is far more than he appears.",
        quote: "Don't feel bad for one moment about doing what brings you joy.",
        price: 510,
        language: "English",
        stock: 7,
        ISBN: "978-1619634442"
    }
];


const authorData = {
    "hemingway": {
        name: "Ernest Hemingway",
        stats: "Nobel Prize in Literature Winner",
        aboutTitle: "ABOUT ERNEST HEMINGWAY",
        aboutText: "Ernest Hemingway was an American novelist, short-story writer, and journalist. His economical and understated style—which he termed the iceberg theory—had a strong influence on 20th-century fiction.",
        bannerImg: "../../resources/Authors/ErnestHemingway.jpg",
        profileImg: "../../resources/Authors/ErnestHemingway.jpg",
        books: [
            { title: "The Old Man ", cover: "../../resources/Books/UglyLove.jpg", rating: "4.8", reviews: "4 m" },
            { title: "A Farewell to Arms", cover: "../../resources/Books/UglyLove.jpg", rating: "4.5", reviews: "2 m" }
        ]
    },

    "nora-roberts": {
        name: "Nora Roberts",
        stats: "21 Times RITA Awards Winner",
        aboutTitle: "ABOUT NORA ROBERTS",
        aboutText: "Nora Roberts is a Sunday Times and International best-selling author. Before writing fiction, Nora spent 11 years as a journalist.",
        bannerImg: "../../resources/Authors/NoraRoberts.jpg",
        profileImg: "../../resources/Authors/NoraRoberts.jpg",
        books: [
            { title: "The Shining", cover: "../../resources/Books/TheShining.jpg" },
            { title: "Journey to the Centre of the Earth", cover: "../../resources/Books/JourneyToTheCentreOfTheEarth.jpg" }
        ]
    },

    "tolstoy": {
        name: "Leo Tolstoy",
        stats: "Russian author of War and Peace",
        aboutTitle: "ABOUT LEO TOLSTOY",
        aboutText: "Count Lev Nikolayevich Tolstoy was a Russian writer who is regarded as one of the greatest authors of all time.",
        bannerImg: "../../resources/Authors/LeoTolstoy.jpg",
        profileImg: "../../resources/Authors/LeoTolstoy.jpg",
        books: [
            { title: "War and Peace", cover: "../../resources/Books/WarAndPeace.png" },
            { title: "Anna Karenina", cover: "../../resources/Books/AnnaKarenina.png" }
        ]
    },

    "jeyamohan": {
        name: "B. Jeyamohan",
        stats: "Writer and Literary Critic",
        aboutTitle: "ABOUT B. JEYAMOHAN",
        aboutText: "B. Jeyamohan is an Indian Tamil and Malayalam language novelist and literary critic.",
        bannerImg: "../../resources/Authors/Jeyamohan.jpg",
        profileImg: "../../resources/Authors/Jeyamohan.jpg",
        books: [
            { title: "Vishnupuram", cover: "../../resources/Books/Vishnupuram.png" }
        ]
    },

    "pratchett": {
        name: "Terry Pratchett",
        stats: "English Fantasy Author",
        aboutTitle: "ABOUT TERRY PRATCHETT",
        aboutText: "Sir Terry Pratchett was an English humorist and author of fantasy novels, best known for his Discworld series.",
        bannerImg: "../../resources/Authors/TerryPratchett.jpg",
        profileImg: "../../resources/Authors/TerryPratchett.jpg",
        books: [
            { title: "The Color of Magic", cover: "../../resources/Books/ColorOfMagic.png" }
        ]
    },

    "astrid-lindgren": {
        name: "Astrid Lindgren",
        stats: "Swedish Children's Author",
        aboutTitle: "ABOUT ASTRID LINDGREN",
        aboutText: "Astrid Lindgren was a Swedish author best known for creating beloved children's characters including Pippi Longstocking.",
        bannerImg: "../../resources/Authors/AstridLindgren.jpg",
        profileImg: "../../resources/Authors/AstridLindgren.jpg",
        books: [
            { title: "Pippi Longstocking", cover: "../../resources/Books/UglyLove.jpg" }
        ]
    },

    "indira-parthasarathy": {
        name: "Indira Parthasarathy",
        stats: "Renowned Tamil Playwright and Novelist",
        aboutTitle: "ABOUT INDIRA PARTHASARATHY",
        aboutText: "Indira Parthasarathy is an acclaimed Tamil writer known for his influential novels, plays, and modern literary voice.",
        bannerImg: "../../resources/Authors/IndiraParthasarathy.jpg",
        profileImg: "../../resources/Authors/IndiraParthasarathy.jpg",
        books: [
            { title: "Kurudhippunal", cover: "../../resources/Books/UglyLove.jpg" }
        ]
    }
};
