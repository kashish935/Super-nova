const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const agent = require('../agent/agent');


async function initSocketServer(httpServer) {

    const io = new Server(httpServer, {
        path: "/api/socket/socket.io/", // since working with alb we need a path to work it with socketio and alb together.
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true,
        },
    })

    //middleware to authenticate the socket connection using JWT token from cookies

    io.use((socket, next) => {

        const cookies = socket.handshake.headers?.cookie;

        const { token } = cookies ? cookie.parse(cookies) : {};

        if (!token) {
            return next(new Error('Token not provided'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            socket.user = decoded;
            socket.token = token;

            next()

        } catch (err) {
            next(new Error('Invalid token'));
        }

    })

    io.on('connection', (socket) => {

        console.log(socket.user, socket.token)

        // Per-connection conversation history so the agent has context across turns
        // (e.g. "add the first one to my cart" after a prior search).
        const history = [];

        //listen for messages from the client and invoke the agent with the message and token
        socket.on('message', async (data) => {

            history.push({ role: "user", content: data });

            const agentResponse = await agent.invoke({
                messages: history
            }, {
                metadata: {
                    token: socket.token
                }
            })

            // Keep our running history in sync with everything the agent produced
            // (assistant replies and any tool-call messages), not just the last one.
            history.length = 0;
            history.push(...agentResponse.messages);

            const lastMessage = agentResponse.messages[ agentResponse.messages.length - 1 ]

            socket.emit('message', lastMessage.content)

        })


    })

}


module.exports = { initSocketServer };