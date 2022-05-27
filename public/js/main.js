const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

// Get username and room from URL
const { room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true,
});

if (room !== undefined) {
	const token = localStorage.getItem("token");
	const nickname = localStorage.getItem("nickname");

	//	const socket = io("https://test.junehan-test.shop");
	const socket = io({
		auth: {
			token,
			nickname,
		},
	});

	socket.on("connect_error", (err) => {
		// AUTH ERROR?
		console.log(err.message); // not Authorized
		console.log(err.data); // retry with login
	});

	// Join chatroom
	socket.emit("joinRoom", { room });

	// Get room and users
	socket.on("roomUsers", ({ room, users }) => {
		outputRoomName(room);
		outputUsers(users);
	});

	// Message from server
	socket.on("message", (message) => {
		if (message.type === "system") {
			console.log(message);
		} else if (message.type === "text") {
			console.log(message);
			outputMessage(message);
			// Scroll down
			chatMessages.scrollTop = chatMessages.scrollHeight;
		} else {
			console.log("Image message");
		}
	});

	// Message submit
	chatForm.addEventListener("submit", (e) => {
		e.preventDefault();

		let text = e.target.elements.msg.value;

		text = text.trim();

		if (!text) {
			return false;
		}
		socket.emit("chatMessage", JSON.stringify({ type: "text", text }));

		// Clear input
		e.target.elements.msg.value = "";
		e.target.elements.msg.focus();
	});
}
// Output message to DOM
function outputMessage(message) {
	const div = document.createElement("div");
	div.classList.add("message");
	const p = document.createElement("p");
	p.classList.add("meta");
	p.innerText = message.nickname;
	p.innerHTML += `<span>${message.time}</span>`;
	div.appendChild(p);
	const para = document.createElement("p");
	para.classList.add("text");
	para.innerText = message.text;
	div.appendChild(para);
	document.querySelector(".chat-messages").appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
	roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
	userList.innerHTML = "";
	users.forEach((user) => {
		const li = document.createElement("li");
		li.innerText = user.nickname;
		li.id = user.id;
		userList.appendChild(li);
	});
}

//Prompt the user before leave chat room
document.getElementById("leave-btn").addEventListener("click", () => {
	const leaveRoom = confirm("Are you sure you want to leave the chatroom?");
	if (leaveRoom) {
		window.location = "../index.html";
	} else {
	}
});
