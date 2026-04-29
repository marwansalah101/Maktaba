const express = require('express');
const path = require('path');

const app = express();
const viewsPath = path.join(__dirname, '..', 'views');

app.use(express.static(viewsPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(viewsPath, 'home.html'));
});
app.listen(3000, () => console.log('Server running on port 3000'));