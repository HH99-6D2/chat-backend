const {
	textMessage,
	imageMessage,
	systemMessage,
	errorMessage,
} = require("./messages");
const {
	userJoin,
	getCurrentUser,
	userLeave,
	getRoomUsers,
} = require("./services");

module.exports = (io) => {
	io.on("connection", async (socket) => {
		socket.on("joinRoom", async ({ room }) => {
			if (isNaN(room)) {
				return socket.emit(
					"chat_error",
					errorMessage("E05", "invalid Room")
				);
			}

			await userLeave(socket.id);
			/* DEPRECATE ON v0.2
			if (isJoined(room, socket.id, socket.uid)) {
				return socket.emit(
					"chat_error",
					errorMessage(
						"E07",
						"Already Joined, NO accept multiple socket per user"
					)
				);
			}
			*/
			/* Will be on v0.2
			if (isNotOpen(room)) {
				return socket.emit(
					"chat_error",
					errorMessage(
						"E06",
						"Room Expired or not opened"
					)
				);
			}
			*/
			const user = await userJoin(
				socket.id,
				socket.uid,
				socket.nickname,
				room
			);
			socket.join(`${user.room}`);
			if (user === null) {
				return socket.emit(
					"chat_error",
					errorMessage(
						"E09",
						"Internal Server Error, Not able to join"
					)
				);
			} else {
				socket.emit("message", systemMessage("welcome to chat"));
				io.to(room).emit("roomUsers", {
					room: room,
					users: await getRoomUsers(room),
				});

				io.to(room).emit(
					"message",
					systemMessage(`user ${user.id} joined`)
				);

				socket.on("chatMessage", async (message) => {
					const user = await getCurrentUser(socket.id);
					message = JSON.parse(message);
					console.log("got message", message);
					let data =
						message.type === "text"
							? textMessage(user.id, user.nickname, message.text)
							: null;
					data =
						message.type === "image"
							? imageMessage(
									user.id,
									user.nickname,
									message.text,
									message.imageUrl
							  )
							: data;

					data !== null
						? io.to(room).emit("message", data)
						: socket.emit(
								"chat_error",
								errorMessage("E08", "Invalid message Type")
						  );
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
