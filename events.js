const formatMessage = require("./messages");
const { userJoin, getCurrentUser } = require("./users");

module.exports = (io) => {
	io.on("connection", (socket) => {
		console.log(socket);
		console.log("new WS conn", socket.id);
		socket.on("joinRoom", ({ id, username, room }) => {
			const user = userJoin(socket.id, id, username, room);
			socket.emit("message", formatMessage("SYSTEM", "welcome to chat"));
			socket.join(user.room);
			socket.broadcast
				.to(user.room)
				.emit("message", formatMessage("SYSTEM", "user joined"));

			socket.on("disconnect", () => {
				io.emit(
					"message",
					formatMessage("SYSTEM", "user left the chat")
				);
			});

			socket.on("chatMessage", (message) => {
				const user = getCurrentUser(socket.id);
				io.to(user.room).emit(
					"message",
					formatMessage(user.username, message)
				);
			});
		});
	});

	return io;
};
