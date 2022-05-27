const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);

//const cors = require("cors");
//app.use(cors());
// HTML
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

// SOCKET IO with CORS and header
const socketio = require("socket.io");
const io = socketio(server, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"],
		//	allowedHeaders: ["Authorization"],
	},
});

io.use((socket, next) => {
	const token = socket.handshake.auth.token;
	const jwt = require("jsonwebtoken");
	jwt.verify(token, "galv", function (err, decoded) {
		if (err) {
			const err = new Error("not Authorized");
			err.data = { content: "retry with login" };
			next(err);
		} else {
			console.log(decoded);
			socket.uid = decoded.id;
			next();
		}
	});
});

const mapEvents = require("./srcs/events");
mapEvents(io);

const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => console.log(`Sever run on ${PORT}`));
