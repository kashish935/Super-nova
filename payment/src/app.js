const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const paymentRoutes = require('./routes/payment.routes');


const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());


app.get('/', (req, res) => {
    res.status(200).json({
        message: "Payment service is running"
    });
})

app.use('/api/payments', paymentRoutes);

module.exports = app;