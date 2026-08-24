const paymentModel = require('../models/payment.model');
const axios = require('axios');
const { publishToQueue } = require("../broker/borker")

require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Local dev default matches the order service's own hardcoded app.listen() port.
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';


async function createPayment(req, res) {
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[ 1 ];

    try {

        const orderId = req.params.orderId;

        const orderResponse = await axios.get(`${ORDER_SERVICE_URL}/api/orders/` + orderId, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })


        // price.amount is stored and displayed in rupees everywhere in this app
        // (product, cart, order totals). Razorpay's API requires the amount in
        // paise (the smallest currency unit) as an integer, so we convert only
        // right here, at the Razorpay boundary — everything else stays in rupees.
        const price = orderResponse.data.order.totalPrice;
        const amountInPaise = Math.round(price.amount * 100);

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: price.currency
        });

        const payment = await paymentModel.create({
            order: orderId,
            razorpayOrderId: order.id,
            user: req.user.id,
            price: {
                amount: price.amount,
                currency: price.currency
            }
        })


        await publishToQueue("PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED", payment)
        await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_INITIATED", {
            email: req.user.email,
            orderId: orderId,
            amount: price.amount,
            currency: price.currency,
            username: req.user.username,
        })
        

        return res.status(201).json({ message: 'Payment initiated', payment });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }

}

async function verifyPayment(req, res) {
    const { razorpayOrderId, paymentId, signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET

    try {

        const { validatePaymentVerification } = require('../../node_modules/razorpay/dist/utils/razorpay-utils.js')

        const isValid = validatePaymentVerification({
            order_id: razorpayOrderId,
            payment_id: paymentId
        }, signature, secret)

        if (!isValid) {
            return res.status(400).json({ message: 'Invalid signature' });
        }

        const payment = await paymentModel.findOne({ razorpayOrderId, status: 'PENDING' });

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        payment.paymentId = paymentId;
        payment.signature = signature;
        payment.status = 'COMPLETED';

        await payment.save();

        await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED",
            {
                email: req.user.email,
                orderId: payment.order,
                paymentId: payment.paymentId,
                amount: payment.price.amount,
                currency: payment.price.currency,
                fullName: req.user.fullName
            }
        )


        await publishToQueue("PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATED", payment)

        // Tell the order service this order's payment is done, so it can
        // move the order from PENDING to CONFIRMED.
        await publishToQueue("PAYMENT_ORDER.PAYMENT_COMPLETED", {
            orderId: payment.order
        })

        res.status(200).json({ message: 'Payment verified successfully', payment });

    } catch (err) {
        console.log(err);

        await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED",
            {
                email: req.user.email,
                paymentId: paymentId,
                orderId: razorpayOrderId,
                fullName: req.user.fullName
            }
        )

        return res.status(500).json({ message: 'Internal Server Error' });
    }
}



module.exports = {
    createPayment,
    verifyPayment
}