const users = [];
const rooms = {};
// JOIN USER TO Chat;
//
async function userJoin(socketId, id, nickname, room) {
	const user = { socketId, id, nickname, room };
	rooms[`${room}`] = rooms[`${room}`] ? rooms[`${room}`] + 1 : 1;
	users.push(user);
	console.log(users);
	return user;
}

async function getCurrentUser(id) {
	return users.find((user) => user.socketId === id);
}

async function userLeave(id) {
	const index = users.findIndex((user) => user.socketId === id);
	let user = null;
	if (index !== -1) {
		user = users.splice(index, 1)[0];
		rooms[`${user.room}`] !== 1
			? rooms[`${user.room}`]--
			: delete rooms[`${user.room}`];
	}
	return user;
}

async function getRoomUsers(room) {
	return users.filter((user) => user.room === room);
}

module.exports = {
	userJoin,
	getCurrentUser,
	userLeave,
	getRoomUsers,
};
