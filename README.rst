WS Backend app
--------------

HOWTO (v0.2)
^^^^^^^^^^^^

- Conection

   .. code-block:: javascript

      const socket = io("https://test.junehan-test.shop", {
          auth: {
              token: localStorage.getItem("token"), // "asjdkajsdlk"
              nickname: localStorage.getItem("nickname"), // testUser
              cType: localStorage.getItem("ctype") // '1'
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
               console.log(err.message); // E01 ~ E0*
               console.log(err.data); // {content: refresh required}
         })

      - message: E01 (Token Expired) / content: refresh required
      - message: E02 (invalid token) / content: login required
      - message: E03 (wrong)  / content: wrong TOKEN (login again)
      - message: E04 (nickname required)  / content: nickname required
      - message: E05 (cType required)  / content: cType required
      - message: E06 (redis conn error)  / content: Redis Connection Error

   - ``chat_error``\: Chat중의 Room에 대한 에러 혹은 메세지에 대한 에러 등이 포함됩니다.

      .. code-block:: javascript

         socket.on("chat_error", (err)=> {
               console.log(err.type); // E1* ~ E1*
               console.log(err.text); // Room invalid || Chat type Error
         })

      - *메세지가 유효하지 않으면 전달을 막거나, 방에 중복접근시 join을 막는 등의 행동*

   - ``roomUsers``\: 방의 유저들의 접속상태를 변경시에 알립니다.

      .. code-block:: javascript

         socket.on("roomUsers", ({ room, users }) => {
             console.log(users);
         });

      .. code-block:: json

         [
             {
                 "id": 5,
                 "nickname": "ANONYMOUS",
                 "cType": "1"
             }
         ]

   - ``message``\: 서버에서 메세지를 같은 방의 다른유저들에게 전달합니다.

      .. code-block:: javascript

         socket.on("message", (message) => {
            if (message.type === "system") {
               console.log(message);
               renderSYSTEMMessage(message);
            } else if (message.type === "text") {
               console.log(message);
               renderTEXTMessage(message);
            } else {
               console.log("Image message");
               renderIMAGEMessage(message);
            }
         });

   - ``timeout``\: 서버에서 방 참여시에 timeout이라는 이벤트를 클라이언트에 전달합니다.

      .. code-block:: javascript

         socket.on("timeout", (left) => {
            setTimeout(() => {socket.emit("leaveRoom")}, left);
         });

   - ``expired``\: 서버에서 방의 종료시간이 만료되어 leaveRoom이벤트를 발생시켰습니다.

      .. code-block:: javascript

         socket.on("expired", (left) => {
            window.location = 'lobby'; // 로비로 돌아간다
         });

      - expire시간이 되면 방에서 나가지게 되며 모든 기록이 삭제됩니다.

         1. 서버가 expired를 감지함
         #. client에 expired이벤트를 전달하고
         #. 해당 room에 연결된 모든 소켓을 leaveRoom시킵니다. (따라서 disconnect가 아니라 나가진 상태입니다.)

- **FROM CLIENT**

   - ``chatMessage``\: 메세지를 서버로 전달합니다. (E1* 에러)

      .. code-block:: javascript

         socket.emit("chatMessage", JSON.stringify({ type: "text", text})); // 일반 메세지
         socket.emit("chatMessage", JSON.stringify({ type: "image", text, imageUrl})); // 이미지와 메세지

   - ``history``\: 방의 참여자였을 경우 join이후 이 이벤트를 발생시키면 기존의 로그를 가져옵니다.

      .. code-block:: javascript

         socket.emit("history"); // 일반 메세지

   - ``joinRoom``\: 방의 채팅에 참여합니다. (다양한 에러처리가 존재합니다. E1* 에러)

      .. code-block:: javascript

         socket.emit("joinRoom", { room: "1" }); // room id -> 유효성검사 + 연결

   - ``leaveRoom``\: leave-room이벤트를 발생시키면서 참여목록에서 제외합니다. 참여자들에게 알람을 보냅니다. (소켓은 유효합니다.)

      .. code-block:: javascript

         socket.emit("leaveRoom");

   - ``offRoom``\: leave-room이벤트를 발생시키면서 참여목록에서 제외하지 않습니다. (소켓은 유효합니다.)

      .. code-block:: javascript

         socket.emit("offRoom");

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

:ErrorMessage: 연결시(connect)에 발생하는 문제가 아니라 진행중에 발생하는 문제이기 때문에, 비정상적인 입력을 전제합니다.

   .. code-block:: json

      {
          type: string, // "E1*"
          text: string  // "some Error 설명" 
      }

   - errorMessage("E10", "Internal Server Error, Not able to join room")
   - errorMessage("E11", "Invalid Room number")
   - errorMessage("E12", "Invalid Room number (Not Exist)")
   - errorMessage("E13", "Room not opened")
   - errorMessage("E14", "Room Expired")
   - errorMessage("E15", "Already joined") // 방 참여 거부
   - errorMessage("E16", "Invalid message Type")
   - errorMessage("E17", "User not belong to any room") // 방 join 다시 필요

