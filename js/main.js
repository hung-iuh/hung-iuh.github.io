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
pc.onicecandidate = (event => event.candidate ? 
  (function () {
    objectData.sender = yourId;
    objectData.ice = JSON.stringify(event.candidate);
    objectData.sdp = JSON.stringify(pc.localDescription);
  })()
 : sendMessage(yourId, objectData));

pc.onaddstream = (event => {
  friendsVideo.srcObject = event.stream;
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

async function readMessage(data) {
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
  await pc.addIceCandidate(iceCandidate).then(async result => {
    await deleteData();
  }).catch(e => {
    console.log(e);
  });

  async function deleteData() {
    return $.ajax({
      url: 'https://sv-call-ajax.herokuapp.com/deleteData',
      type: 'post',
      'success': function(data) { 
        console.log(data.message);
      }
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
        console.log(data);
        if (data.sender != yourId) {
          readMessage(data);
        }  
      }
    });
  },1000);
}
