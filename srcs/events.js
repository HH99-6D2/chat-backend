const { textMessage, systemMessage } = require("./messages");
const {
	userJoin,
	getCurrentUser,
	userLeave,
	getRoomUsers,
} = require("./services");

module.exports = (io) => {
	io.on("connection", async (socket) => {
		socket.on("joinRoom", async ({ room }) => {
			console.log(room);
			if (isNaN(room)) {
				socket.emit("error", systemMessage("invalid Room"));
			} else {
				const user = await userJoin(
					socket.id,
					socket.uid,
					socket.nickname,
					room
				);
				socket.join(user.room);
				socket.emit("message", systemMessage("welcome to chat"));
				io.to(user.room).emit("roomUsers", {
					room: user.room,
					users: await getRoomUsers(user.room),
				});

				io.to(user.room).emit(
					"message",
					systemMessage(`user ${user.id} joined`)
				);

				socket.on("chatMessage", async (message) => {
					const user = await getCurrentUser(socket.id);
					message = JSON.parse(message);
					console.log(user);
					let data =
						message.type === "text"
							? textMessage(user.id, user.nickname, message.text)
							: {};
					data =
						message.type === "image"
							? imageMessage(
									user.id,
									user.nickname,
									message.text,
									message.imageUrl
							  )
							: data;

					data
						? io.to(user.room).emit("message", data)
						: socket.emit("error", systemMessage("InvalidMessage"));
				});

				socket.on("disconnect", async () => {
					const user = await userLeave(socket.id);
					if (user) {
						const room = user.room;
						io.to(room).emit(
							"message",
							systemMessage(`user ${user.uid} left the chat`)
						);
						io.to(room).emit("roomUsers", {
							room: user.room,
							users: await getRoomUsers(user.room),
						});
					} else {
						socket.emit(
							"error",
							systemMessage("Not found in connected")
						);
					}
				});
			}
		});
	});

	return io;
};
