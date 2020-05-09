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
var objectData = {ice: []};
var order = 0;

pc.onicecandidate = (event => event.candidate ? 
  (function () {
    objectData.ice.push(JSON.stringify(event.candidate));
  })()
 : sendMessage(yourId, objectData));

pc.onaddstream = (async event => {
  friendsVideo.srcObject = event.stream;
  await deleteData();
});

function setUser(name) {
  yourId = name;
  showMyFace();
  checkCall();
}

function sendMessage(senderId, data) {
  data.sender = yourId;
  data.sdp = JSON.stringify(pc.localDescription);

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
  for (let i in data.ice) {
    var iceCandidate = new RTCIceCandidate(JSON.parse(data.ice[i]));
    pc.addIceCandidate(iceCandidate)
    .catch(e => {
      console.log(e);
    });
  }
  return;
};

function deleteData () {
  return $.ajax({
    url: 'http://localhost:9000/deleteData',
    type: 'post',
    'success': function(data) { 
      console.log(data.message);
    }
  });
}

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
        if (!data.data) {
          return console.log('Data empty');
        }
        var data = JSON.parse(data.data);
        if (data.sender != yourId) {
          readMessage(data);
        }  
      }
    });
  },1000);
}
