const express = require('express');
const path = require('path');

const app = express();

const viewsPath = path.join(__dirname, '..', 'views');

app.use(express.json());
// Routes
const routes = require("./routes");//bn3ml route ll main file l feh l routes
app.use("/", routes); //bngeeb kol routes l fe routes.js


app.use("/books", bookRoutes);
app.get('/', (req, res) => {
    res.sendFile(path.join(viewsPath, 'home.html'));
});
app.listen(3000, () => console.log('Server running on port 3000'));