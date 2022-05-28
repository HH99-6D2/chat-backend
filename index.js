const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);

//const cors = require("cors");
//app.use(cors());
// HTML
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
require("dotenv").config();

// SOCKET IO with CORS and header
const socketio = require("socket.io");
const io = socketio(server, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"],
		credentials: false,
	},
});

io.use((socket, next) => {
	const token = socket.handshake.auth.token;
	const jwt = require("jsonwebtoken");
	jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
		if (err) {
			/*
			if (err.name === "TokenExpiredError") {
				const err = new Error("E01");
				err.data = { content: "refresh required" };
				next(err);
			} else if (err.name === "JsonWebTokenError") {
				const err = new Error("E02");
				err.data = { content: "login required" };
				next(err);
			} else {
				const err = new Error("E03");
				err.data = { content: "wrong" };
				next(err);
			}
			*/
			socket.uid = 1000;
			next();
		} else {
			socket.uid = decoded.id;
			next();
		}
	});
});

io.use((socket, next) => {
	const nickname = socket.handshake.auth.nickname;
	console.log(nickname);
	if (!nickname) {
		/*
		const err = new Error("E04");
		err.data = { content: "nickname required" };
		next(err);
		*/
		socket.nickname = "ANONYMOUS";
		next();
	} else {
		socket.nickname = nickname;
		next();
	}
});

// Redis client
const { createClient } = require("redis");
const client = createClient({
	url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});
client.on("ERROR", (err) => console.log("Redis client error", err));
client.connect();

const mapEvents = require("./srcs/events");
mapEvents(io, client);

// Redis adapter
/*
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const pubClient = createClient({
	host: process.env.REDIS_HOST,
	port: process.env.REDIS_PORT,
});
const subClient = pubClient.duplicate();

pubClient.on("error", (err) => {
	console.log(err.message);
});
subClient.on("error", (err) => {
	console.log(err.message);
});

const PORT = 3000 || process.env.PORT;
Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
	io.adapter(createAdapter(pubClient, subClient));
	server.listen(PORT, () => console.log(`Sever run on ${PORT}`));
});
*/
const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Sever run on ${PORT}`));
