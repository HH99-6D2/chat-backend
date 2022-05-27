const moment = require("moment");

module.exports.systemMessage = (text) => {
	return { type: "system", text, time: moment().format("h:mm a") };
};

module.exports.textMessage = (id, nickname, text) => {
	return {
		type: "text",
		id,
		nickname,
		text,
		time: moment().format("h:mm a"),
	};
};

module.exports.imageMessage = (id, nickname, text, imageUrl) => {
	return {
		type: "image",
		id,
		nickname,
		text,
		imageUrl,
		time: moment().format("h:mm a"),
	};
};
