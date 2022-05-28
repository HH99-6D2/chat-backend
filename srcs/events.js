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
	saveMessage,
	getLogs,
	validateRoom,
} = require("./services");

module.exports = (io) => {
	io.on("connection", async (socket) => {
		socket.on("joinRoom", async ({ room }) => {
			if (isNaN(room)) {
				return socket.emit(
					"chat_error",
					errorMessage("E11", "Invalid Room number")
				);
			}

			await userLeave(socket.redisClient, socket.id);
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
						"E12",
						"Room Expired or not opened"
					)
				);
			}
			*/
			const isInvalid = await validateRoom(room);
			if (isInvalid) {
				if (isInvalid === -1)
					return socket.emit(
						"chat_error",
						errorMessage("E12", "Invalid Room number (Not Exist)")
					);
				return isInvalid === 1
					? socket.emit(
							"chat_error",
							errorMessage("E13", "Room not opened")
					  )
					: socket.emit(
							"chat_error",
							errorMessage("E14", "Room Expired")
					  );
			}

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
						"E10",
						"Internal Server Error, Not able to join"
					)
				);
			} else {
				socket.emit("message", systemMessage("welcome to chat"));
				socket.emit("history", await getLogs(socket.redisClient, room));
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
					const room = user.room;
					message = JSON.parse(message);
					console.log(message);
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

					if (data !== null) {
						io.to(room).emit("message", data);
						await saveMessage(socket.redisClient, room, data);
					} else {
						socket.emit(
							"chat_error",
							errorMessage("E16", "Invalid message Type")
						);
					}
				});

				socket.on("leaveRoom", async () => {
					socket.emit(
						"message",
						systemMessage(`you Leave the chat room.`)
					);
					socket.disconnect();
				});

				socket.on("disconnect", async () => {
					const user = await userLeave(socket.redisClient, socket.id);
					console.log(user);
					const room = user.room;
					io.to(room).emit(
						"message",
						systemMessage(`user ${user.id} left the chat`)
					);
					io.to(room).emit("roomUsers", {
						room: user.room,
						users: await getRoomUsers(user.room),
					});
				});
			}
		});
	});

	return io;
};
