
const express = require('express');
const mongoose = require('mongoose');
const citiesRoutes = require('./routes/cities');


const app = express();


app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/citydb')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Use city routes
app.use('/api', citiesRoutes);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});