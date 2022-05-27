const moment = require("moment");

module.exports.systemMessage = (text) => {
	return { type: "system", text, time: moment().format("h:mm a") };
};

module.exports.textMessage = (id, text, username) => {
	return {
		type: "text",
		id,
		text,
		username,
		time: moment().format("h:mm a"),
	};
};
module.exports.imageMessage = (id, text, username, imageUrl) => {
	return {
		type: "image",
		id,
		text,
		username,
		imageUrl,
		time: moment().format("h:mm a"),
	};
};
