const formatMessage = require("./messages");

module.exports = (io) => {
	io.on("connection", (socket) => {
		console.log(socket);
		console.log("new WS conn", socket.id);
		socket.emit("message", formatMessage("SYSTEM", "welcome to chat"));
		socket.broadcast.emit("message", "user joined");

		socket.on("disconnect", () => {
			io.emit("message", formatMessage("SYSTEM", "user left the chat"));
		});

		socket.on("chatMessage", (message) => {
			io.emit("message", formatMessage("user", message));
		});
	});

	return io;
};
