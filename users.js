const users = [];
// JOIN USER TO Chat;
//
function userJoin(socketId, id, username, room) {
	const user = { socketId, id, username, room };
	users.push(user);
	return user;
}

function getCurrentUser(id) {
	return users.find((user) => user.socketId === id);
}

module.exports = {
	userJoin,
	getCurrentUser,
};
