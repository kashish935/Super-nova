const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const productRoutes = require('./routes/product.routes');

const app = express();
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

//POST /api/products
app.get('/', (req, res) => {
    res.status(200).json({
        message: "Product service is running"
    });
})

app.use('/api/products', productRoutes);

module.exports = app;