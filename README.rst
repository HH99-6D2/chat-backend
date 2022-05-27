WS Backend app
--------------

추가 기능 TODO
--------------

   - socket Backend redis로 변경
   - service의 기능들 redis기능으로 변경

      - Event: "history" - 해당 room의 로그를 가져옴

   - room에 대한 유효성 검사
   - Event: "alert" 이벤트 정의

      - 방에 중복 로그인 할수없다. *(이미 같은 유저가 해당 방에 들어와 있다.)*
      - 해당 방이 유효하지 않다. *(해당 방은 만료되었다.)*
      - 백엔드가 불가피하게 종료하였다? *(동작중 레디스 백엔드가 Stop 했을 때 서버에서 소켓을 핸들링 가능하다면, 해당 서버를 통한 소켓만 핸들링 가능할 가능성이 높음)*
      - 채팅방 번호가 유효한 숫자가 아닐 경우 *(connection 이후 join(room)을 하기 때문에 해당소켓에 alert)*

   - redis 조작 연습

HOWTO
^^^^^

- Conection

   .. code-block:: javascript

      const socket = io("https://test.junehan-test.shop", {
          auth: {
              token: localStorage.getItem("token"),
              nickname: localStorage.getItem("token"),
          },
      });

      socket.emit("joinRoom", { room: "1" }); // room id -> 유효성검사 + 연결

   - Test환경에서 nickname이나 토큰이 유효하지 않을 경우, 아래와 같이 고정됩니다.

      - nickname: ``ANONYMOUS``
      - id: ``1000``

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

