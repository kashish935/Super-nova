const { promises } = require("supertest/lib/test");
const orderModel = require("../models/order.model")
const axios = require("axios")
const { publishToQueue } = require("../broker/borker");

// Local dev defaults match each service's own hardcoded app.listen() port.
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:3002';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';


async function createOrder(req, res) {

    const user = req.user;
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[ 1 ];

    try {

        // fetch user cart from cart service
        const cartResponse = await axios.get(`${CART_SERVICE_URL}/api/cart`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        //we want actual price of products, so we fetch product details from product service

        const products = await Promise.all(cartResponse.data.cart.items.map(async (item) => {

            return (await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${item.productId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })).data.data

        }))

        //check if products are in stock and calculate total price, and accordingly decrease the stock of products in product service

        let priceAmount = 0;

        const orderItems = cartResponse.data.cart.items.map((item, index) => {


            const product = products.find(p => p._id === item.productId)

            // if not in stock, does not allow order creation

            if (product.stock < item.quantity) {
                throw new Error(`Product ${product.title} is out of stock or insufficient stock`)
            }

            const itemTotal = product.price.amount * item.quantity;
            priceAmount += itemTotal;

            return {
                product: item.productId,
                quantity: item.quantity,
                price: {
                    amount: itemTotal,
                    currency: product.price.currency
                }
            }
        })

        //order creation 
        
        const order = await orderModel.create({
            user: user.id,
            items: orderItems,
            status: "PENDING",
            totalPrice: {
                amount: priceAmount,
                currency: "INR" // assuming all products are in USD for simplicity
            },
            shippingAddress: {
                street: req.body.shippingAddress.street,
                city: req.body.shippingAddress.city,
                state: req.body.shippingAddress.state,
                zip: req.body.shippingAddress.pincode,
                country: req.body.shippingAddress.country,
            }
        })

        await publishToQueue("ORDER_SELLER_DASHBOARD.ORDER_CREATED", order)

        // Decrement stock for each ordered product. Best-effort: the order itself is already
        // placed, so a failure here is logged rather than rolling back the order.
        await Promise.all(orderItems.map(async (item) => {
            try {
                await axios.patch(`${PRODUCT_SERVICE_URL}/api/products/${item.product}/stock`, {
                    quantity: item.quantity
                }, {
                    headers: {
                        'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET
                    }
                })
            } catch (stockErr) {
                console.error(`Failed to decrement stock for product ${item.product}:`, stockErr.message)
            }
        }))

        res.status(201).json({ order })

    } catch (error) {
    console.log(error);

    res.status(500).json({
        message: "Internal server error",
        error: error.message
    });
}

}

async function getMyOrders(req, res) {
    const user = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const orders = await orderModel.find({ user: user.id }).skip(skip).limit(limit).exec();
        const totalOrders = await orderModel.countDocuments({ user: user.id });

        res.status(200).json({
            orders,
            meta: {
                total: totalOrders,
                page,
                limit
            }
        })
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message })
    }
}

async function getOrderById(req, res) {
    const user = req.user;
    const orderId = req.params.id;

    try {
        const order = await orderModel.findById(orderId)

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.user.toString() !== user.id) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this order" });
        }

        res.status(200).json({ order })
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message })
    }
}

async function cancelOrderById(req, res) {
    const user = req.user;
    const orderId = req.params.id;

    try {
        const order = await orderModel.findById(orderId)

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.user.toString() !== user.id) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this order" });
        }

        // only PENDING orders can be cancelled
        if (order.status !== "PENDING") {
            return res.status(409).json({ message: "Order cannot be cancelled at this stage" });
        }

        order.status = "CANCELLED";
        await order.save();

        await publishToQueue("ORDER_SELLER_DASHBOARD.ORDER_STATUS_UPDATED", {
            orderId: order._id,
            status: order.status
        });

        res.status(200).json({ order });
    } catch (err) {

        console.error(err);

        res.status(500).json({ message: "Internal server error", error: err.message });
    }
}


async function updateOrderAddress(req, res) {
    const user = req.user;
    const orderId = req.params.id;

    try {
        const order = await orderModel.findById(orderId)

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.user.toString() !== user.id) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this order" });
        }

        // only PENDING orders can have address updated
        if (order.status !== "PENDING") {
            return res.status(409).json({ message: "Order address cannot be updated at this stage" });
        }

        order.shippingAddress = {
            street: req.body.shippingAddress.street,
            city: req.body.shippingAddress.city,
            state: req.body.shippingAddress.state,
            zip: req.body.shippingAddress.pincode,
            country: req.body.shippingAddress.country,
        };

        await order.save();

        res.status(200).json({ order });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
}

// Called by the queue consumer in server.js when a PAYMENT_ORDER.PAYMENT_COMPLETED
// message arrives — not an HTTP route. Mirrors cancelOrderById's pattern of
// updating status and notifying the seller dashboard.
async function confirmOrderPayment({ orderId }) {
    try {
        const order = await orderModel.findById(orderId);

        if (!order) {
            console.warn(`confirmOrderPayment: order ${orderId} not found`);
            return;
        }

        // Only move PENDING orders forward — avoids clobbering a CANCELLED
        // order if cancellation and payment verification race each other.
        if (order.status !== "PENDING") {
            console.warn(`confirmOrderPayment: order ${orderId} is ${order.status}, not PENDING — skipping`);
            return;
        }

        order.status = "CONFIRMED";
        await order.save();

        await publishToQueue("ORDER_SELLER_DASHBOARD.ORDER_STATUS_UPDATED", {
            orderId: order._id,
            status: order.status
        });
    } catch (err) {
        console.error(`confirmOrderPayment failed for order ${orderId}:`, err.message);
    }
}

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrderById,
    updateOrderAddress,
    confirmOrderPayment
}