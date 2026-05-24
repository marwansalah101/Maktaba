require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Author = require('./models/Author');

const authors = [
  {
    name: 'Naguib Mahfouz',
    slug: 'naguib-mahfouz',
    stats: '57 Books · Nobel Prize Winner',
    aboutTitle: 'The Voice of Egypt',
    aboutText: 'Naguib Mahfouz was an Egyptian writer who won the 1988 Nobel Prize in Literature. He is regarded as one of the first contemporary writers of Arabic literature.',
    bannerImg: '',
    profileImg: ''
  },
  {
    name: 'Paulo Coelho',
    slug: 'paulo-coelho',
    stats: '30 Books · 150M Copies Sold',
    aboutTitle: 'The Alchemist Author',
    aboutText: 'Paulo Coelho is a Brazilian lyricist and novelist, best known for his novel The Alchemist. It has been translated into 80 languages.',
    bannerImg: '',
    profileImg: ''
  },
  {
    name: 'Fyodor Dostoevsky',
    slug: 'fyodor-dostoevsky',
    stats: '12 Novels · Russian Literary Giant',
    aboutTitle: 'Master of Psychological Fiction',
    aboutText: 'Fyodor Dostoevsky was a Russian novelist whose works explore human psychology in the troubled political, social and spiritual atmosphere of 19th-century Russia.',
    bannerImg: '',
    profileImg: ''
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await Author.deleteMany();
    await Author.insertMany(authors);
    console.log('✅ Authors sample successfully!');
    process.exit();
  })
  .catch(err => {
    console.log('❌ Error:', err);
    process.exit();
  });