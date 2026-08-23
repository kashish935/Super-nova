const express = require('express');
const cartRoutes = require('./routes/cart.routes');
const cookieParser = require('cookie-parser');
const cors = require('cors');


const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());



app.get('/', (req, res) => {
    res.status(200).json({
        message: "Cart service is running"
    });
})

app.use('/api/cart', cartRoutes);





module.exports = app;