const { textMessage, systemMessage } = require("./messages");
const {
	userJoin,
	getCurrentUser,
	userLeave,
	getRoomUsers,
	statRoomUsers,
} = require("./users");

module.exports = (io) => {
	io.on("connection", async (socket) => {
		socket.on("joinRoom", async ({ id, username, room }) => {
			const user = await userJoin(socket.id, id, username, room);
			socket.join(user.room);
			// 전체에게 현황 전달
			// 해당 방의 유저에게 전달

			if (room !== 0) {
				// Lobby 가 아닐 경우
				socket.emit("message", systemMessage("welcome to chat"));
				console.log(user.room);
				io.to(user.room).emit("roomUsers", {
					room: user.room,
					users: await getRoomUsers(user.room),
				});

				io.to(user.room).emit(
					"message",
					systemMessage(`user ${user.id} joined`)
				);
			} else {
				socket.emit("message", systemMessage("welcome to lobby"));
			}

			socket.on("chatMessage", async (message) => {
				const user = await getCurrentUser(socket.id);
				message = JSON.parse(message);
				console.log(message);
				let data =
					message.type === "text"
						? textMessage(user.id, message.text, user.username)
						: {};
				data =
					message.type === "image"
						? imageMessage(
								user.id,
								message.text,
								user.username,
								message.imageUrl
						  )
						: data;

				if (data) {
					socket.emit("message", systemMessage("welcome to lobby"));
					io.to(user.room).emit("message", data);
				}
			});
			socket.on("disconnect", async () => {
				const user = await userLeave(socket.id);
				const room = user ? parseInt(user.room) : 0;
				if (user && room) {
					io.to(user.room).emit(
						"message",
						systemMessage(`user ${user.id} left the chat`)
					);
					io.to(user.room).emit("roomUsers", {
						room: user.room,
						users: getRoomUsers(user.room),
					});
				}
			});
		});
	});

	return io;
};
