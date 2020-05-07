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
pc.onicecandidate = event => sendMessage(yourId, JSON.stringify({
    'ice': event.candidate
}));

pc.onaddstream = (event => {
  friendsVideo.srcObject = event.stream;
});

function setUser(name) {
  yourId = name;
  showMyFace();
  checkCall();
}

var objectData = {};
var stt = 0;
function sendMessage(senderId, data) {
  if (JSON.parse(data).ice != null || JSON.parse(data).sdp) {
    objectData[stt++] = {
      sender: senderId,
      message: data
    };
  }
  else if (JSON.parse(data).ice == null) {
    $.ajax({
      url: 'https://sv-call-ajax.herokuapp.com/sendData',
      type: 'post',
      data: objectData,
      'success': function(data) {
          objectData = [];
          stt = 0;
      }
    });
  }  
}

async function readMessage(sender, msg) {
  //console.log('myID: ', yourId);
  //console.log(sender, msg);
  if (msg.ice != undefined) {
      var iceCandidate = new RTCIceCandidate(msg.ice);
      pc.addIceCandidate(iceCandidate).catch(e => {
        console.log(e);
      });
      return;
  }
  if (msg.sdp.type == "offer") {
  pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
  .then(() => pc.createAnswer().catch(e => {
    console.log(e);
  }))
  .then(answer => pc.setLocalDescription(answer))
  .then(() => sendMessage(yourId, JSON.stringify({
      'sdp': pc.localDescription
  })));
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
    .then(() => {sendMessage(yourId, JSON.stringify({
          'sdp': pc.localDescription
      }));
    });
}

function checkCall() {
  var myInterval = setInterval(function () {
    $.ajax({
      url: 'https://sv-call-ajax.herokuapp.com/getData',
      type: 'get',
      'success': async function(data) {
      var data = JSON.parse(data.data);
        for (let i in data) {
          var sender = data[i].sender;
          if (sender != yourId) {
            var msg = data[i].message;
            readMessage(sender, JSON.parse(msg));
          }
        }
      }
    });
  },1000);
}
