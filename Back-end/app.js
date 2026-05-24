require('dotenv').config({ path: '../.env' });
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


const authorRoutes = require('./routes/Authors');
app.use('/api/authors', authorRoutes);


// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 2000,
      maxPoolSize: 10,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.log('❌ MongoDB connection error:', err);
    setTimeout(connectDB, 5000);
  }
};

connectDB();

mongoose.connection.on('disconnected', () => {
  console.log('❌ MongoDB disconnected — reconnecting...');
  setTimeout(connectDB, 5000);
});

app.listen(3000, () => console.log('Server running on port 3000'));
