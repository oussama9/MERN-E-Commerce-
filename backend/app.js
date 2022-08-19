const express = require('express');
const app = express();
const errorMiddlware = require('./middlewares/errors');
const cookieParser = require('cookie-parser');

app.use(express.json());
app.use(cookieParser());

//Import all routes 
const products = require('./routes/productRoutes');
const auth = require('./routes/authRoutes');
const order = require('./routes/orderRoutes');

app.use('/api/v1', products);
app.use('/api/v1', auth);
app.use('/api/v1', order);

// Middlware to handle errors
app.use(errorMiddlware);

module.exports = app