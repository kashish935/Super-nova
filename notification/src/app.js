const express = require("express");
const { connect, subscribeToQueue } = require("./borker/borker");
const setListeners = require("./borker/listners");
const app = express();

connect().then(() => {
    setListeners();
})//jb hm successfully rabbitmq s connect honge tb chlenge listners yh


app.get("/", (req, res) => {
    res.status(200).json({
        message: "Notification service is running"
    });
})



module.exports = app;