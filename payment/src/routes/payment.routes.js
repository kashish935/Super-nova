const express = require('express');
const createAuthMiddleware = require("../middlewares/auth.middleware")
const paymentController = require("../controllers/payment.controller")



const router = express.Router();

//all the routes are protected and only accessible to authenticated users with the role of "user"

router.post("/create/:orderId", createAuthMiddleware([ "user" ]), paymentController.createPayment)

router.post("/verify", createAuthMiddleware([ "user" ]), paymentController.verifyPayment)

module.exports = router;