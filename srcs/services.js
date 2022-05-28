const axios = require("axios");
const users = [];
const rooms = {};

// JOIN USER TO Chat;
async function userJoin(socketId, id, nickname, cType, room) {
	const user = { socketId, id, nickname, cType, room };
	rooms[`${room}`] = rooms[`${room}`] ? rooms[`${room}`] + 1 : 1;
	users.push(user);
	console.log("join users", users);
	console.log("join rooms", rooms);
	return user;
}

async function getCurrentUser(id) {
	return users.find((user) => user.socketId === id);
}

async function userLeave(client, id) {
	const index = users.findIndex((user) => user.socketId === id);
	let user = null;
	if (index !== -1) {
		user = users.splice(index, 1)[0];
		if (rooms[`${user.room}`] > 1) {
			rooms[`${user.room}`]--;
		} else if (rooms[`${user.room}`] == 1) {
			delete rooms[`${user.room}`];
			await deleteLogs(client, user.room);
		}
	}
	console.log("leave users", users);
	console.log("leave rooms", rooms);
	return user;
}

async function getRoomUsers(room) {
	return users
		.filter((user) => user.room === room)
		.map((user) => {
			return { id: user.id, nickname: user.nickname, cType: user.cType };
		});
}

async function getLogs(client, room) {
	const logs = await client.get(room);
	console.log("hitory", logs);
	return logs;
}

async function deleteLogs(client, room) {
	return client.del(room);
}

async function saveMessage(client, room, message) {
	console.log(1);
	let data = await client.get(room);
	console.log(2);
	console.log(3, data);
	if (!data) {
		validateRoom(room);
		await client.set(room, "[]");
		data = await client.get(room);
	}
	console.log(4, data);
	const json = JSON.parse(data);
	json.push(message);
	return client.set(room, JSON.stringify(json));
}

async function validateRoom(room) {
	const ret = await axios
		.get(`https://yogoloper.shop/api/rooms/${room}`)
		.then((res) => res)
		.catch((err) => {
			return 0;
		});
	if (ret && ret.status === 200) {
		const { startDate, endDate } = ret.data;
		const now = new Date(Date.now());
		if (new Date(startDate) > now) return 1;
		return new Date(endDate) < now ? 2 : 0;
	}
	return -1;
}

/* // DEPRECATE on v0.2
async function isJoined(sid, uid) {
	return users.find((user) => user.id === sid || user);
}
*/

module.exports = {
	userJoin,
	getCurrentUser,
	userLeave,
	getRoomUsers,
	getLogs,
	saveMessage,
	validateRoom,
};
