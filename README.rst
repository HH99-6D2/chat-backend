WS Backend app
--------------

추가 기능 TODO v0.1 -> v0.2
---------------------------

   - socket Backend redis로 변경 (x)
   - service의 기능들 redis기능으로 변경 (DONE)

      - Event: "history" - 해당 room의 로그를 가져옴

   - room에 대한 유효성 검사 (x)
   - Event: "chat_error" 이벤트 정의 (DONE)

      - 방에 중복 로그인 할수없다. *(이미 같은 유저가 해당 방에 들어와 있다.)*
      - 해당 방이 유효하지 않다. *(해당 방은 만료되었다.)*
      - 백엔드가 불가피하게 종료하였다? *(동작중 레디스 백엔드가 Stop 했을 때 서버에서 소켓을 핸들링 가능하다면, 해당 서버를 통한 소켓만 핸들링 가능할 가능성이 높음)*
      - 채팅방 번호가 유효한 숫자가 아닐 경우 *(connection 이후 join(room)을 하기 때문에 해당소켓에 alert레벨의 별도 이벤트가 필요합니다.)*

   - Event: "leave" 이벤트 정의 (x)

     - 다른방에 Join할 경우에 기존의 방에서 나가지는 스펙을 추가하였습니다. 하지만 클라이언트가 소켓을 유지할 경우 채팅 알림은 계속됩니다. 따라서 detach라는 개념의 메뉴얼한 새로운 이벤트를 정의할 필요가 있습니다.(로비에 나갔을 때 더이상 알림을 받지 않도록 소켓은 유지하되 방에서는 나가는.)

   - Event: "history" 이벤트 정의 (x)

     - 만약 참여했던 방에 재참여하는 경우라면 history이벤트를 통해 기존의 채팅로그를 불러옵니다. 새로 참여한 유저라면 클라이언트에서 history이벤트를 발생시키지 않는 것을 추천합니다.

HOWTO (v0.1 -> v0.2)
^^^^^^^^^^^^^^^^^^^^

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

   - 기본적으로 client에서 Location이 변경되면(새로고침) disconnect이벤트가 발생하여 방에서 나가집니다.

   - 다른방에 Join할 경우에 기존의 방에서 나가지는 스펙을 추가하였습니다. 따라서 detach라는 메뉴얼한 새로운 이벤트를 정의할 필요가 있습니다.(로비에 나갔을때 더이상 알림을 받지 않도록 소켓은 유지하되 방에서는 나가는.)
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
      - message: E05 (redis conn error)  / content: Redis Connection Error

   -  **v0.2** ``chat_error``\: Chat중의 Room에 대한 에러 혹은 메세지에 대한 에러 등이 포함됩니다.

      .. code-block:: javascript

         socket.on("chat_error", (err)=> {
               console.log(err.type); // E05 ~ E08
               console.log(err.text); // Room invalid || Chat type Error
         })

      - *메세지가 유효하지 않으면 전달을 막거나, 방에 중복접근시 join을 막는 등의 행동*

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

   - ``history``\: 방의 참여자였을 경우 join이후 이 이벤트를 발생시키면 기존의 로그를 가져옵니다.

      .. code-block:: javascript

         socket.emit("history"); // 일반 메세지


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

:History:

   .. code-block:: json

      [
         <Image Message>, <Text Message> ...
      ]

:ErrorMessage: **v0.2** 연결시(connect)에 발생하는 문제가 아니라 진행중에 발생하는 문제이기 때문에, 비정상적인 입력을 전제합니다.

   .. code-block:: json

      {
          type: string, // "E05", "E0*"
          text: string  // "in" 
      }

   - errorMessage("E11", "Invalid Room number")
   - errorMessage("E12", "Room Expired or not opened")
   - errorMessage("E13", "Invalid message Type")
   - errorMessage("E14", "Internal Server Error, Not able to join room")

   .. note::

      E07의 에러: v0.1 -> v0.2

      기본적으로 발생하지 않을 계획입니다.
      방에 들어가는 것은 기본적으로 기존에 참여했던 방에서 나가는 것을 포함합니다.

      - errorMessage("E07", "Already Joined, NOT accept join per user")

         - 소켓을 새로 만들어서 연결해도 유저가 같은 id를 가졌다면 참여를 거부합니다.
         - 해당 방에 재참여하는 경우도, disconnect하지 않고 이미 연결되어있다면, 참여를 거부합니다.


