const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const mongoURI = 'mongodb://127.0.0.1:27017/statesDB';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware to parse JSON and URL encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const State = require('./models/States');

const statesRoutes = require('./routes/statesRoutes');
app.use('/states', statesRoutes);
app.use((req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.send('<h1>404 Not Found</h1>');
    } else if (req.accepts('json')) {
        res.json({ error: "404 Not Found" });
    } else {
        res.type('txt').send('404 Not Found');
    }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});