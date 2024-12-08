- Socket.io
- Peerjs
- uuid
- webRTC

- Process of Establishing the Connection btw devices connected across the server:-

1)	User requests for homepage but express server creates a uuid and redirects it to /uuid

2)	When User now comes at /uuid, server extracts this Room ID/ Uuid from the URL and serves the room.ejs file in Response.  It also sends this extracted Room Id to room.ejs (Client Side).

3)	It requests access to the user's camera and microphone using getUserMedia() and sets up a video stream.

4)	It creates a new instance of Peer and emits a join-room event with the room ID and peer ID when the connection is established.

5)	Upon receiving the join-room event, the server adds the client to the specified room and emits a user-connected event to notify other clients in the same room.

6)	Upon receiving the user-connected event  from server.  

	-> Existing User calls the new user and sends him(New) his(Existing) stream 

	-> Existing User calls Sets up a Listener to Receive the new user's stream


7)	Similarly, the new user  does  2 Things:-

	-> The new user invokes the answer() method on the call object and passes its own stream (myVideoStream) as an argument.
 

	-> New user calls Sets up a Listener to Receive the existing user's stream


How we Removed Duplicity Issue?
Refer - https://github.com/peers/peerjs/issues/609