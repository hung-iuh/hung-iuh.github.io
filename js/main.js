var yourVideo = document.getElementById("yourVideo");
var friendsVideo = document.getElementById("friendsVideo");
var yourId;

var servers = {
    'iceServers': [
    // {
    //     'urls': 'stun:stun.services.mozilla.com'
    // }, {
    //     'urls': 'stun:stun.l.google.com:19302'
    // }, 
      {
          'urls': 'turn:turn-server.fi.ai:3478',
          'credentials': '123',
          'credential': '123',
          'username': 'hung'
      }
    ]
};
var pc = new RTCPeerConnection(servers);
pc.onicecandidate = (event => event.candidate ? sendMessage(yourId, JSON.stringify({
    'ice': event.candidate,
    'sdp': pc.localDescription
})) : console.log("Sent All Ice"));

pc.onaddstream = (event => {
  friendsVideo.srcObject = event.stream;
});

function setUser(name) {
  yourId = name;
  showMyFace();
  checkCall();
}

function sendMessage(senderId, data) {
  var msg = {
    sender: senderId,
    message: data
  };

  $.ajax({
    url: 'http://localhost:9000/sendData',
    type: 'post',
    data: msg,
    dataType: "json",
    'success': function(data) {
        readMessage(data.data);
    }
  });
}

function readMessage(data) {
  console.log('myID: ', yourId);
  var data = JSON.parse(data);
  var sender = data.sender;
  var msg = JSON.parse(data.message);
  console.log(sender, msg);
  if (sender == yourId) {
    return;
  }
  if (msg.ice != undefined) {
      var iceCandidate = new RTCIceCandidate(msg.ice);
      pc.addIceCandidate(iceCandidate).catch(e => {
        console.log(e);
      });
  }
  if (msg.sdp.type == "offer") {
  pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
  .then(() => pc.createAnswer().catch(e => {
    console.log(e);
  }))
  .then(answer => pc.setLocalDescription(answer))
  // .then(() => sendMessage(yourId, JSON.stringify({
  //     'sdp': pc.localDescription
  // })));
  return;
  }
  if (msg.sdp.type == "answer") {
    pc.setRemoteDescription(new RTCSessionDescription(msg.sdp)).catch(e => {
      console.log(e);
    });
  }
};

function showMyFace() {
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  })
  .then(stream => yourVideo.srcObject = stream)
  .then(stream => pc.addStream(stream));
}

function showFriendsFace() {
  pc.createOffer()
    .then(offer => pc.setLocalDescription(offer))
    // .then(() => {sendMessage(yourId, JSON.stringify({
    //     'sdp': pc.localDescription
    // }));
    //});
}

function checkCall() {
  var myInterval = setInterval(function () {
    $.ajax({
      url: 'http://localhost:9000/getData',
      type: 'get',
      dataType: "json",
      'success': function(data) {
        if (JSON.parse(data.data).sender != yourId) {
          readMessage(data.data);
        }
      }
    });
  },1000);
}
