require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db');
const { connect, subscribeToQueue } = require("./src/broker/borker")
const { confirmOrderPayment } = require('./src/controllers/order.controller');

connectDB();
connect().then(() => {
    // Payment service publishes here once a payment is verified — move the
    // matching order from PENDING to CONFIRMED.
    subscribeToQueue("PAYMENT_ORDER.PAYMENT_COMPLETED", confirmOrderPayment);
});


app.listen(process.env.PORT || 3003, () => {
    console.log("Order service is running on port 3003");
})