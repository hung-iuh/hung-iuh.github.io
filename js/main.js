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
var objectData = {};
var order = 0;
pc.onicecandidate = (event => event.candidate ? 
  (function () {
    // objectData.sender = yourId;
    // objectData.ice = JSON.stringify(event.candidate);
    // objectData.sdp = JSON.stringify(pc.localDescription);
    objectData[order++] = {
      ice: JSON.stringify(event.candidate),
    }
  })()
 : sendMessage(objectData));

pc.onaddstream = (event => {
  friendsVideo.srcObject = event.stream;
});

function setUser(name) {
  yourId = name;
  showMyFace();
  checkCall();
}

function sendMessage(data) {
  var sentData = {
    sender: yourId,
    sdp: JSON.stringify(pc.localDescription),
    ice: data
  }
  $.ajax({
    url: 'https://sv-call-ajax.herokuapp.com/sendData',
    type: 'post',
    data: sentData,
    'success': function(data) {
    }
  });
}

function readMessage(sdp, ice) {
  var iceCandidate = new RTCIceCandidate(ice);
  pc.addIceCandidate(iceCandidate).catch(e => {
    console.log(e);
  });
      
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
  pc.createOffer()
    .then(offer => pc.setLocalDescription(offer));
}

function checkCall() {
  var myInterval = setInterval(function () {
    $.ajax({
      url: 'https://sv-call-ajax.herokuapp.com/getData',
      type: 'get',
      'success': function(data) {
        var data = JSON.parse(data.data);
        var sdp = data.sdp;
        if (data.sender != yourId) {
          var ice = data.ice;
          for ( let i in ice ) {
            readMessage(JSON.parse(sdp), JSON.parse(ice[i].ice));
          }
        }
      }
    });
  },3000);
}
