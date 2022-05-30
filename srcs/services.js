const axios = require("axios");
const users = []; // [1,2,3,4] 현재 유저들
const rooms = {}; // {1: [1,2,3,4], 2: [2,4] } // 기록상 유저들

// JOIN USER TO Chat;
async function userJoin(id, nickname, cType, room) {
	const user = { id, nickname, cType, room };

	console.log("id:", id);
	console.log(users);
	const findUser = await getCurrentUser(id);
	if (findUser === undefined) {
		console.log("activeUsers", users);
		users.push(user);
		return user;
	}
	return null;
}

async function roomJoin(socket, room, io) {
	const { uid, nickname, cType } = socket;
	const user = {
		id: socket.uid,
		nickname: socket.nickname,
		cType: socket.cType,
	};
	const now = new Date(Date.now() + 1000 * 60 * 60 * 9);
	if (!rooms[`${room}`]) {
		const [startDate, endDate] = await getStartEnd(room);
		rooms[`${room}`] = [[startDate, endDate]];
		await socket.redisClient.set(room, "[]");
		// Exit event
		setTimeout(async () => {
			const activeUsers = users.filter((user) => user.room === room);
			io.to(room).emit("message", {
				type: "system",
				text: "expired",
			});

			activeUsers.map(async (user) => {
				await userLeave(user.id);
			});

			io.to(room).emit("expired");

			io.in(room).socketsLeave(room);
			delete rooms[`${room}`];
			await deleteRoom(socket.redisClient, room);
		}, endDate - now);
	}

	if ((await getCurrentRoomUser(socket.uid, room)) === undefined) {
		console.log(rooms);
		rooms[`${room}`].push(user);
		console.log("JOINED To ROOM", rooms[`${room}`]);
	} else {
		console.log("already JOINED To ROOM", rooms[`${room}`]);
	}
	return rooms[`${room}`][0][1] - now;
}

async function getCurrentUser(id) {
	return users.find((user) => user.id === id);
}

async function getCurrentRoomUser(id, room) {
	if (rooms[`${room}`])
		return rooms[`${room}`].find((user) => user.id === id);
	return undefined;
}

async function roomLeave(client, id, room) {
	let user = null;
	if (rooms[room]) {
		const index = rooms[room].findIndex((user) => user.id === id);
		if (index !== -1) {
			user = rooms[`${room}`].splice(index, 1)[0];
			if (rooms[`${room}`].length == 1) {
				return null;
			}
		}
	}
	return user;
}

async function userLeave(id) {
	const index = users.findIndex((user) => user.id === id);
	console.log(users);
	let user = null;
	console.log(index);
	if (index !== -1) {
		user = users.splice(index, 1)[0];
		console.log("leave user from roomsocket", users);
	}
	console.log("leavedUser", user);
	return user;
}

async function getRoomUsers(room) {
	let roomUsers = rooms[`${room}`];
	if (roomUsers.length > 1) {
		roomUsers = roomUsers.slice(1);
		return roomUsers.map((user) => {
			return { id: user.id, nickname: user.nickname, cType: user.cType };
		});
	}
	return [];
}

async function getLogs(client, room) {
	const logs = await client.get(room);
	console.log("hitory", logs);
	return logs;
}

async function deleteRoom(client, room) {
	return client.del(room);
}

async function saveMessage(client, room, message) {
	let data = await client.get(room);
	console.log("message", data);
	if (!data) {
		const isInvalid = await validateRoom(room);
		if (isInvalid) return 0;
		await client.set(room, "[]");
		data = await client.get(room);
	}
	const json = JSON.parse(data);
	json.push(message);
	client.set(room, JSON.stringify(json));
	return 1;
}

async function validateRoom(room) {
	const dates = await getStartEnd(room);
	if (!dates.length) return -1;
	const now = new Date(Date.now() + 1000 * 60 * 60 * 9);
	const [startDate, endDate] = dates;
	if (startDate > now) return 1;
	return endDate < now ? 2 : 0;
}

async function getStartEnd(room) {
	const ret = await axios
		.get(`https://yogoloper.shop/api/rooms/${room}`)
		.then((res) => res)
		.catch((err) => {
			return 0;
		});
	if (ret && ret.status === 200) {
		const { startDate, endDate } = ret.data;
		return [new Date(startDate), new Date(endDate)];
	}
	return [];
}

module.exports = {
	userJoin,
	userLeave,
	roomJoin,
	roomLeave,
	saveMessage,
	getCurrentUser,
	getRoomUsers,
	getLogs,
	validateRoom,
};
