require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db');
const { connect } = require("./src/broker/borker")

connectDB();

connect();

app.listen(process.env.PORT || 3001, () => {
    console.log('Product service listening on port 3001');
})