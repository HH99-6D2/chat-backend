module.exports = (io) => {
	io.on("connection", (socket) => {
		console.log(socket);
		console.log("new WS conn", socket.id);
		socket.emit("message", "welcome to chat");
		socket.broadcast.emit("message", "user joined");

		socket.on("disconnect", () => {
			io.emit("message", "user left the chat");
		});

		socket.on("chatMessage", (message) => {
			console.log("message");
			io.emit("message", message);
		});
	});

	return io;
};
