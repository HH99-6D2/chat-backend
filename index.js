const http = require("http");
const path = require("path");
const express = require("express");
const app = express();
const socketio = require("socket.io");

const PORT = 3000 || process.env.PORT;

app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = require("./events")(socketio(server));

server.listen(PORT, () => console.log(`Sever run on ${PORT}`));
