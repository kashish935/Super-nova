const express = require('express');
const cors = require('cors');


const app = express();
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));


app.get('/', (req, res) => {
    res.status(200).json({
        message: "AI service is running"
    });
});


module.exports = app;