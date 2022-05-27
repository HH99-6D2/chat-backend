WS Backend app
--------------

- Conection

   .. code-block:: javascript

      const socket = io({
          auth: {
              token: localStorage.getItem("token"),
              nickname: localStorage.getItem("token"),
          },
      });

Events
^^^^^^

- **FROM SERVER**

   - ``connect_error``\: Builtin error로 인증 에러 등에 사용됩니다.

      .. code-block:: javascript

         socket.on("connect_error", (err)=> {
               console.log(err.message); // E01
               console.log(err.data); // {content: refresh required}
         })

      - message: E01 (Token Expired) / content: refresh required
      - message: E02 (invalid token) / content: login required
      - message: E03 (wrong)  / content: wrong (login again)
      - message: E04 (nickname required)  / content: nickname required

   - ``roomUsers``\: 방의 유저들의 접속상태를 변경시에 알립니다.

      .. code-block:: javascript

         socket.on("roomUsers", ({ room, users }) => {
             outputRoomName(room);
             outputUsers(users);
         });

   - ``message``\: 서버에서 메세지를 같은 방의 다른유저들에게 전달합니다.

      .. code-block:: javascript

         socket.on("message", (message) => {
            if (message.type === "system") {
               console.log(message);
            } else if (message.type === "text") {
               console.log(message);
            } else {
               console.log("Image message");
            }
         });

- **FROM CLIENT**

   - ``chatMessage``\: 메세지를 서버로 전달합니다.

      .. code-block:: javascript

         socket.emit("chatMessage", JSON.stringify({ type: "text", text})); // 일반 메세지

         socket.emit("chatMessage", JSON.stringify({ type: "image", text, imageUrl})); // 이미지와 메세지

MESSAGES
^^^^^^^^

:System:

   .. code-block:: json

      {
          type: "system",
          text: string,
          time: moment().format("h:mm a")
      }

:Text:

   .. code-block:: json

      {
          type: "text",
          id: number, // user id
          text: string, // message
          nickname: string, // user nickname
          time: moment().format("h:mm a") // "4:41 pm"
      }

:Image:

   .. code-block:: json

      {
          type: "image",
          id: number,
          text: string,
          nickname: string,
          imageUrl: string,
          time: moment().format("h:mm a")
      }

