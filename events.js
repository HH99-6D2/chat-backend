const formatMessage = require("./messages");
const {
	userJoin,
	getCurrentUser,
	userLeave,
	getRoomUsers,
} = require("./users");

module.exports = (io) => {
	io.on("connection", (socket) => {
		console.log("new WS conn", socket.id);
		socket.on("joinRoom", ({ id, username, room }) => {
			const user = userJoin(socket.id, id, username, room);
			socket.emit("message", formatMessage("_SYS", "welcome to chat"));
			socket.join(user.room);
			socket.broadcast
				.to(user.room)
				.emit(
					"message",
					formatMessage("_SYS", `user ${user.id} joined`)
				);

			socket.on("disconnect", () => {
				const user = userLeave(socket.id);
				if (user) {
					io.to(user.room).emit(
						"message",
						formatMessage("_SYS", `user ${user.id} left the chat`)
					);
				}
			});

			socket.on("chatMessage", (message) => {
				const user = getCurrentUser(socket.id);
				io.to(user.room).emit(
					"message",
					formatMessage(user.id, message)
				);
			});
		});
	});

	return io;
};
