const moment = require("moment-timezone");

module.exports.systemMessage = (text) => {
	return {
		type: "system",
		text,
		time: moment().tz("Asia/Seoul").format("h:mm a"),
	};
};

module.exports.errorMessage = (errno, text) => {
	return { type: errno, text };
};

module.exports.textMessage = (id, nickname, text) => {
	return {
		type: "text",
		id,
		nickname,
		text,
		time: moment().tz("Asia/Seoul").format("h:mm a"),
	};
};

module.exports.imageMessage = (id, nickname, text, imageUrl) => {
	return {
		type: "image",
		id,
		nickname,
		text,
		imageUrl,
		time: moment().tz("Asia/Seoul").format("h:mm a"),
	};
};
