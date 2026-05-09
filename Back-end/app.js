const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

const viewsPath = path.join(__dirname, '..', 'views');
const cors = require('cors');
app.use(cors()); // Put this above your routes!

app.use(express.json());

// Routes
const routes = require("./routes/routes");//bn3ml route ll main file l feh l routes
app.use("/", routes); //bngeeb kol routes l fe routes.js


// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/Books', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log('MongoDB connection error:', err));

app.listen(3000, () => console.log('Server running on port 3000'));
