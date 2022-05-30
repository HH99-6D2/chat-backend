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
	roomLeave,
	getRoomUsers,
	saveMessage,
	getLogs,
	validateRoom,
	roomJoin,
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

			const isInvalid = await validateRoom(room);
			if (isInvalid !== 0) {
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

			const joinedUser = await userLeave(socket.uid);

			if (joinedUser !== null) {
				console.log(joinedUser.room, "was in the room");
				socket.leave(joinedUser.room);
			}

			const user = await userJoin(
				socket.uid,
				socket.nickname,
				socket.cType,
				room
			);

			if (user === null) {
				return socket.emit(
					"chat_error",
					errorMessage("E15", "Already joined by another socket")
				);
			} else {
				const timeout = await roomJoin(socket, room, io);
				socket.room = room;
				socket.join(`${user.room}`); // 소켓연결코드
				socket.emit("history", await getLogs(socket.redisClient, room));
				socket.emit("timeout", timeout); // 남은시간

				const roomUsers = await getRoomUsers(room);
				io.to(room).emit("roomUsers", {
					room: room,
					users: roomUsers,
				});

				io.to(room).emit(
					"message",
					systemMessage(`user ${socket.uid} joined`)
				);

				socket.on("chatMessage", async (message) => {
					const user = await getCurrentUser(socket.uid);
					if (!user)
						return socket.emit(
							"chat_error",
							errorMessage("E17", "User not belong to any room")
						);

					const room = socket.room;
					message = JSON.parse(message);
					console.log(message);
					let data =
						message.type === "text"
							? textMessage(
									socket.uid,
									socket.nickname,
									message.text
							  )
							: null;
					data =
						message.type === "image"
							? imageMessage(
									socket.uid,
									socket.nickname,
									message.text,
									message.imageUrl
							  )
							: data;

					if (data !== null) {
						const saved = await saveMessage(
							socket.redisClient,
							room,
							data
						);
						if (saved) {
							io.to(room).emit("message", {
								...data,
								cType: socket.cType,
							});
						} else {
							closeRoom(room);
						}
					} else {
						socket.emit(
							"chat_error",
							errorMessage("E16", "Invalid message Type")
						);
					}
				});

				socket.on("leaveRoom", async () => {
					const user = await userLeave(socket.uid);
					const left = await roomLeave(
						socket.redisClient,
						socket.uid,
						socket.room
					);
					socket.emit(
						"message",
						systemMessage(`you leave the chat room.`)
					);

					if (left !== null) {
						io.to(socket.room).emit(
							"message",
							systemMessage(`user ${socket.uid} left the chat`)
						);
						io.to(socket.room).emit("roomUsers", {
							room: socket.room,
							users: await getRoomUsers(socket.room),
						});
					}
					socket.leave(socket.room);
				});

				/* 추가 */
				socket.on("offRoom", async () => {
					socket.emit(
						"message",
						systemMessage(`you off the chat room.`)
					);
					const user = await userLeave(socket.uid);
					await socket.leave(user.room);
				});

				socket.on("disconnect", async () => {
					const user = await userLeave(socket.uid);
					const left = await roomLeave(
						socket.redisClient,
						socket.uid,
						socket.room
					);
					if (left !== null) {
						const room = socket.room;
						io.to(room).emit(
							"message",
							systemMessage(`${socket.uid} left the chat`)
						);
						io.to(room).emit("roomUsers", {
							room: socket.room,
							users: await getRoomUsers(socket.room),
						});
					}
				});
			}
		});
	});

	return io;
};
