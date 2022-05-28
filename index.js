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
io.use(async (socket, next) => {
	const { createClient } = require("redis");
	try {
		const client = createClient({
			url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
		});
		await client.connect();
		socket.redisClient = client;
		next();
	} catch (error) {
		console.log("REDIS CONN ERROR", error);
		const err = new Error("E05");
		err.data = { content: "Redis Connection Error" };
		next(err);
	}
});

const mapEvents = require("./srcs/events");
mapEvents(io);

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Sever run on ${PORT}`));
