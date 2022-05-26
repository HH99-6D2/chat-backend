const users = [];
const rooms = {};
// JOIN USER TO Chat;
function userJoin(socketId, id, username, room) {
	const user = { socketId, id, username, room };
	rooms[`${room}`] = rooms[`${room}`] ? rooms[`${room}`] + 1 : 1;
	users.push(user);
	return user;
}

function getCurrentUser(id) {
	return users.find((user) => user.socketId === id);
}

function userLeave(id) {
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

function getRoomUsers(room) {
	return users.filter((user) => user.room === room);
}

module.exports = {
	userJoin,
	getCurrentUser,
	userLeave,
	getRoomUsers,
};
