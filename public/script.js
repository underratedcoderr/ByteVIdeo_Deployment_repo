const socket = io("/");

let myVideoStream;
const videoGrid = document.getElementById("video-grid");
//Referring video-grid from room.ejs

const myVideo = document.createElement("video");
//Created a Video Tag in Html DOM at Runtime
myVideo.muted = true;

const callList = [];

var myUserName;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {

    myUserName = prompt("Please enter your name");

    myVideoStream = stream;
    addVideoStream(myVideo, myVideoStream);

    var peer = new Peer(undefined, {
      path: "/peerjs",
      host: "/",
      port: 3000,
    });
    /*
    - This line creates a new instance of the Peer object. The first argument, undefined, is used to let the library generate a unique ID for the peer. The second argument is an options object which configures the Peer object.
    
    - { path: "/peerjs", host: "/", port: 3030 }: These are the options passed to configure the Peer object:
    
    1) path: This specifies the path where the PeerServer is located. In this case, it's set to "/peerjs".
    2) host: This specifies the host where the PeerServer is located. In this case, it's set to "/". This usually means that the host is the same as the current domain where the code is running.
    3) port: This specifies the port number on which the PeerServer is running. In this case, it's set to 3030. */

    peer.on("open", (id) => {
      alert("Your URL is: \n\n" + window.location.href + "\n\nOn clicking ok, it will be copied to your clipboard.\nFeel free to share it with your friends.");
      copyToClipboard(window.location.href);
      socket.emit("join-room", ROOM_ID, id);
    });
    /* peer.on('open', ...) sets up an event listener for when the Peer object created at line 20 successfully connects to the PeerServer and obtains its own ID. */


    //New User's code:
    peer.on("call", call => {                 
      //The new User is Answering the call at line(61) from the existing User(every existing User will call the new User as soon as he connects to the room)
      call.answer(myVideoStream);
      call.on("stream", existingUserVideoStream => {
        
        if(callList[call.peer])
          return;
        const video = document.createElement("video");
        addVideoStream(video, existingUserVideoStream);
        callList[call.peer] = call;
      });
      /* Steps involved from New User's Perspective:
      1) New user supplies his own stream to the calling existing user.
      2) New user calls Sets up a Listener to Receive the existing user's stream */
    });
    
    //Existing User's code:
    socket.on("user-connected", (userId) => {  //As soon as a new user connects to the room, the existing user will receive a "user-connected" event from the server.
      connectToNewUser(userId, myVideoStream); //Inside this function, the existing user establishes a Send/Receive Channel with the new user
      /* Steps involved from Existing User's Perspective:
      1) Existing User calls the new user and sends him(New) his(Existing) stream
      2) Existing User calls Sets up a Listener to Receive the new user's stream*/
    });
    
    const connectToNewUser = (userId, myVideoStream) => {
      const call = peer.call(userId, myVideoStream);
      //Existing User calls the new user and sends him(New) his(Existing) stream
      call.on("stream", newUserVideoStream => {
        
        if(callList[call.peer])
          return;
        const video = document.createElement("video");
        addVideoStream(video, newUserVideoStream);
        callList[call.peer] = call;
      });
      //Existing User receives the new user's Stream and adds it to his own Video Grid
    };
  });
//Note that we are doing work of sending stream inside "then" of the promise returned by getUserMedia. This is because we need to have access to the stream before we can send it.

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  videoGrid.append(video);
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
};
/* Here's a breakdown of what the function does:

video.srcObject = stream;: This line sets the srcObject property of the video element to the provided stream. This associates the video element with a media stream, typically obtained from a user's camera or microphone using APIs like getUserMedia().

video.addEventListener('loadedmetadata', () => { video.play(); });: This line adds an event listener to the video element. The event being listened for is 'loadedmetadata', which fires when the browser has loaded metadata for the video (such as its dimensions and duration). When this event occurs, the provided callback function is executed. In this case, the callback simply calls video.play(), which starts playing the video.

So, essentially, this function sets up a video element to display a live video stream provided by the stream parameter. Once the metadata of the video is loaded, it automatically starts playing the video.
 */

let text = document.querySelector("input");
document.querySelector("html").addEventListener("keydown", function (e) {
  if (e.key == "Enter" && text.value.length !== 0) {
    console.log(text.value);
    socket.emit("message", text.value, myUserName);
    text.value = "";
  }
});

socket.on("createMessage", (message, userName) => {
  console.log("This is coming from server", message);
  document.querySelector("ul").innerHTML += `<li class="message"><b>${userName}</b><br/>&nbsp${message}</li>`; // &nbsp is for space
  scrollToBottom();
});

/*Process of chatting:
1) Frontend extracts the message from the input and sends it to server by emitting "message" event.
2) In backend, a socket.on("message", (message)=> {...}) catches the "message" event and captures the message.
3) Then, the message is emitted to all frontends using "createMessage" event.
4) Then, every frontend catches "createMessage" event and captures the message and displays it.

Note that broadcast is different from emit: emit sends to all people in room while broadcast is to all except the sender. 
*/

const scrollToBottom = () => {
  let chatWindow = document.querySelector(".main__chat_window");
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

//Mute/Unmute our audio
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if(enabled){
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

//Play/Stop our video:
const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if(enabled){
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideoButton();
  } else {
    setStopVideoButton();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setStopVideoButton = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideoButton = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      console.log('Text copied to clipboard');
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
    });
}

document.querySelector("#chat_section_toggle_button").addEventListener("click", () => {
  document.querySelector('#chat_section_toggle_button').classList.toggle('closed_chat_section');
  document.querySelector('.main__left').classList.toggle('closed_chat_section');
  document.querySelector('.main__right').classList.toggle('closed_chat_section');
});

document.getElementById("leave-meeting").addEventListener("click", () => {
  socket.emit("leave-meeting");
});

socket.on("meeting-ended", () => {
  // Redirect or handle meeting ending logic here
  alert("This Meeting has ended. \nIf you wish to Start the Meeting Again, Click Ok and you will be Redirected to a New Private Room.");
  // Example: Redirect to home page
  window.location.href = "/";
});
