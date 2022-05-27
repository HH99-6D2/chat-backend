const http = require("http");
const path = require("path");
const express = require("express");
const app = express();
const socketio = require("socket.io");
const cors = require("cors");

const PORT = 3000 || process.env.PORT;

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = require("./events")(
	socketio(server, {
		cors: {
			origin: "http://localhost:3000",
			methods: ["GET", "POST"],
			allowedHeaders: ["Authorization"],
		},
	})
);

server.listen(PORT, () => console.log(`Sever run on ${PORT}`));
