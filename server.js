const express = require("express");
const { v4: uuidv4 } = require("uuid");
//Create an Instance of Express Class
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");

app.set("view engine", "ejs");
app.use(express.static("public"));

const peerServer = ExpressPeerServer(server, {
  debug: true,
});
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
  //   res.status(200).send("Welcome");

  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);

    socket.on("message", (message, userName) => {
      io.to(roomId).emit("createMessage", message, userName);
    });

    socket.on("leave-meeting", () => {
      io.to(roomId).emit("meeting-ended");
    });

    /*Cases:-
    io->includes self(called emitting)
    socket->excludes self(called broadcasting)
    1) io.emit() => sends to literally everyone(Including Self)
    2) socket.emit() => sends to everyone(Excluding Self)
 
    Using roomId:
    3) io.to(roomId).emit() => sends to everyone(Including Self) in the room
    4) socket.broadcast.to(roomId).emit()=> sends to everyone(Excluding Self) in the room
    
    NOTE:
    1) A socket represents a single connection between a client and the server
    2) Room is a concept used to group sockets together.
    */
  });
});

server.listen(3000);
//Port at which Backend Server will listen is 3030
