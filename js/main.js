var yourVideo = document.getElementById("yourVideo");
var friendsVideo = document.getElementById("friendsVideo");
var yourId;

var servers = {
  'iceServers': [
    // {
    //     'urls': 'stun:stun.services.mozilla.com'
    // }, 
    // {
    //     'urls': 'stun:stun.l.google.com:19302'
    // }, 
    {
        'urls': 'turn:turn-server.fi.ai:3478',
        'credential': '123',
        'username': 'hung'
    }
  ]
};

var pc = new RTCPeerConnection(servers);
var objectData = {};
pc.onicecandidate = (event => event.candidate ? 
  (function () {
    objectData.sender = yourId;
    objectData.ice = JSON.stringify(event.candidate);
    objectData.sdp = JSON.stringify(pc.localDescription);
  })()
 : sendMessage(yourId, objectData));

pc.onaddstream = (event => {
  friendsVideo.srcObject = event.stream;
  $.ajax({
    url: 'https://sv-call-ajax.herokuapp.com/deleteData',
    type: 'post',
    'success': function(data) { 
      console.log(data.message);
    }
  });
});

function setUser(name) {
  yourId = name;
  showMyFace();
  checkCall();
}

function sendMessage(senderId, data) {
  $.ajax({
    url: 'https://sv-call-ajax.herokuapp.com/sendData',
    type: 'post',
    data: data,
    'success': function(data) {
    }
  });
}

function readMessage(data) {
  var sdp = JSON.parse(data.sdp);
      
  if (sdp.type == "offer") {
  pc.setRemoteDescription(new RTCSessionDescription(sdp))
  .then(() => pc.createAnswer().catch(e => {
    console.log(e);
  }))
  .then(answer => pc.setLocalDescription(answer));
  }
  
  if (sdp.type == "answer") {
    pc.setRemoteDescription(new RTCSessionDescription(sdp)).catch(e => {
      console.log(e);
    });
  }

  var iceCandidate = new RTCIceCandidate(JSON.parse(data.ice));
  pc.addIceCandidate(iceCandidate)
  .catch(e => {
    console.log(e);
  });
  return;
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
  pc.createOffer({iceRestart: true})
    .then(offer => pc.setLocalDescription(offer));
}
var processing=false;
function checkCall() {
  var myInterval = setInterval(function () {
    if (!processing) {
      processing=true;
      $.ajax({
        url: 'https://sv-call-ajax.herokuapp.com/getData',
        type: 'get',
        'success': function(data) {
          processing = false;
          if (!data.data) {
            return console.log('Data empty');
            // return;
          }
          var data = JSON.parse(data.data);
          console.log(data);
          if (data.sender != yourId) {
            readMessage(data);
          }  
        }
      });
    }
  },1000);
}
