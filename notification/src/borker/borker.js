const amqplib = require('amqplib');


//rabitmq or notification service connect hoti hai or usme hm multiple channel create krte hai , ideally ek hi channel hota hai.
let channel, connection;

//yh connect krega server ko rabitmq se 
async function connect() {

    if (connection) return connection;

    try {
        connection = await amqplib.connect(process.env.RABBIT_URL);
        console.log('Connected to RabbitMQ');
        channel = await connection.createChannel();
    }
    catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
    }

}

//publishToQueue function is used to send messages to a specific queue in RabbitMQ. It takes the queue name and the data to be sent as parameters. If the channel or connection is not established, it calls the connect function to establish the connection first. Then, it asserts the queue (creates it if it doesn't exist) and sends the message to the queue in JSON format.
async function publishToQueue(queueName, data = {}) {
    if (!channel || !connection) await connect();

    await channel.assertQueue(queueName, {
        durable: true
    });//if queue exist , then put mssg in queue else create then put in

    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
    console.log('Message sent to queue:', queueName, data);
}

//it helps to read the data from queue , vo callback chlaega
async function subscribeToQueue(queueName, callback) {

    if (!channel || !connection) await connect();

    await channel.assertQueue(queueName, {
        durable: true
    });

    channel.consume(queueName, async (msg) => {
        if (msg !== null) {
            const data = JSON.parse(msg.content.toString());
            await callback(data);
            channel.ack(msg);
        }
    })

}





module.exports = {
    connect,
    channel,
    connection,
    publishToQueue,
    subscribeToQueue
}