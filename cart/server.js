const app = require('./src/app');
const connectDB = require('./src/db/db');

connectDB();

app.listen(process.env.PORT || 3002, ()=>{
    console.log("Cart service is running on port 3002");
})